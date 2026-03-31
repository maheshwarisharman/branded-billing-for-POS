/**
 * routes/bills.ts — Bill ingestion and retrieval
 *
 * POST /bills/ingest
 *   Receives multipart/form-data from the BillDrop daemon.
 *   - Authenticates via `merchantKey` form field
 *   - Uploads the PDF to S3
 *   - Inserts a bill record into Supabase
 *
 * GET /bills
 *   Returns paginated bills for the authenticated merchant.
 *   Query params: limit, offset, phone, orderId
 *
 * GET /bills/:id
 *   Returns bill metadata + a 15-minute presigned S3 URL for the PDF.
 */

import Elysia, { t } from 'elysia';
import { supabase, type BillRow } from '../supabase';
import { uploadToS3, getPresignedUrl, buildS3Key } from '../s3';
import { resolveMerchant, merchantAuth } from '../auth';

import { sendWhatsAppMessage } from '../utils/aisensy';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** The daemon sends "null" (string) for missing fields — normalise to null. */
function nullify(val: string | undefined): string | null {
  if (!val || val === 'null') return null;
  return val.trim() || null;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export const billRoutes = new Elysia({ prefix: '/bills' })

  // ─── POST /bills/ingest ──────────────────────────────────────────────────────
  // The daemon POSTs here with multipart/form-data containing the raw PDF and
  // extracted fields.  Auth is done via the `merchantKey` form field (not header).
  .post(
    '/ingest',
    async ({ body, set }) => {
      // 1. Resolve merchant from the form-field key
      const merchant = await resolveMerchant(body.merchantKey);
      if (!merchant) {
        set.status = 401;
        return { ok: false, message: 'Invalid merchant key' };
      }

      // 2. Read the uploaded file into a Buffer
      const pdfFile = body.pdf;
      const filename = pdfFile.name || 'bill.pdf';
      const arrayBuffer = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.byteLength === 0) {
        set.status = 400;
        return { ok: false, message: 'Uploaded PDF is empty' };
      }

      // 3. Upload to S3
      const s3Key = buildS3Key(merchant.id, filename);
      try {
        await uploadToS3(s3Key, buffer);
      } catch (s3Err) {
        console.error('[bills/ingest] S3 upload failed', s3Err);
        set.status = 502;
        return { ok: false, message: 'Failed to store PDF' };
      }

      // 4. Insert bill record into Supabase
      const { data, error: dbErr } = await supabase
        .from('bills')
        .insert({
          merchant_id: merchant.id,
          filename,
          s3_key:   s3Key,
          phone:    nullify(body.phone),
          name:     nullify(body.name),
          order_id: nullify(body.orderId),
          status:   'received',
        })
        .select('id, created_at, phone, name')
        .single();

      if (dbErr || !data) {
        console.error('[bills/ingest] DB insert error', dbErr);
        set.status = 500;
        return { ok: false, message: 'Failed to record bill' };
      }
      
      await sendWhatsAppMessage(data.phone, data.id, data.name)
      set.status = 201;
      return {
        ok:        true,
        billId:    data.id,
        s3Key,
        createdAt: data.created_at,
      };
    },
    {
      body: t.Object({
        pdf:         t.File({ type: 'application/pdf' }),
        merchantKey: t.String({ minLength: 1 }),
        phone:       t.Optional(t.String()),
        name:        t.Optional(t.String()),
        orderId:     t.Optional(t.String()),
      }),
    },
  )

  // ─── Authenticated routes (Bearer merchantKey header) ─────────────────────
  .use(merchantAuth)

  // ─── GET /bills ──────────────────────────────────────────────────────────────
  .get(
    '/',
    async ({ merchant, query, set }) => {
      // merchantAuth sets status 401 and returns merchant:null on bad key
      if (!merchant) return { ok: false, message: 'Unauthorized' };

      const limit  = Math.min(Number(query.limit  ?? 50), 200);
      const offset = Number(query.offset ?? 0);

      let q = supabase
        .from('bills')
        .select('id, filename, phone, name, order_id, status, created_at', { count: 'exact' })
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (query.phone)   q = q.eq('phone',    query.phone);
      if (query.orderId) q = q.eq('order_id', query.orderId);

      const { data, error: dbErr, count } = await q;

      if (dbErr) {
        console.error('[bills] list error', dbErr);
        set.status = 500;
        return { ok: false, message: 'Failed to fetch bills' };
      }

      return {
        ok:    true,
        total: count ?? 0,
        limit,
        offset,
        bills: data as BillRow[],
      };
    },
    {
      query: t.Object({
        limit:   t.Optional(t.String()),
        offset:  t.Optional(t.String()),
        phone:   t.Optional(t.String()),
        orderId: t.Optional(t.String()),
      }),
    },
  )

  // ─── GET /bills/:id ──────────────────────────────────────────────────────────
  .get(
    '/:id',
    async ({ merchant, params, set }) => {
      // merchantAuth sets status 401 and returns merchant:null on bad key
      if (!merchant) return { ok: false, message: 'Unauthorized' };

      const { data, error: dbErr } = await supabase
        .from('bills')
        .select('*')
        .eq('id', params.id)
        .eq('merchant_id', merchant.id)   // scope to this merchant only
        .single();

      if (dbErr || !data) {
        set.status = 404;
        return { ok: false, message: 'Bill not found' };
      }

      const bill = data as BillRow;

      // Generate a 15-minute presigned URL for the PDF
      let downloadUrl: string | null = null;
      try {
        downloadUrl = await getPresignedUrl(bill.s3_key, 900);
      } catch (pErr) {
        console.error('[bills/:id] presign error', pErr);
        // Non-fatal — return the record without a download URL
      }

      return {
        ok:  true,
        bill: {
          id:          bill.id,
          filename:    bill.filename,
          phone:       bill.phone,
          name:        bill.name,
          orderId:     bill.order_id,
          status:      bill.status,
          createdAt:   bill.created_at,
          downloadUrl,
        },
      };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  );
