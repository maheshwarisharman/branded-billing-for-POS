/**
 * routes/merchants.ts — Merchant provisioning (admin-only)
 *
 * POST /merchants
 *   Creates a new merchant and returns a freshly generated API key.
 *   Protected by the ADMIN_KEY env var via the `x-admin-key` header.
 */

import Elysia, { t } from 'elysia';
import { randomBytes } from 'crypto';
import { supabase } from '../supabase';
import { env } from '../env';

export const merchantRoutes = new Elysia({ prefix: '/merchants' })

  // ─── POST /merchants ────────────────────────────────────────────────────────
  .post(
    '/',
    async ({ body, headers, set }) => {
      // Admin gate
      if (headers['x-admin-key'] !== env.ADMIN_KEY) {
        set.status = 401;
        return { ok: false, message: 'Unauthorized' };
      }

      const apiKey = randomBytes(32).toString('hex'); // 64-char hex key

      const { data, error: dbErr } = await supabase
        .from('merchants')
        .insert({ name: body.name, api_key: apiKey })
        .select('id, name, created_at')
        .single();

      if (dbErr || !data) {
        console.error('[merchants] insert error', dbErr);
        set.status = 500;
        return { ok: false, message: 'Failed to create merchant' };
      }

      set.status = 201;
      return {
        ok:         true,
        merchantId: data.id,
        name:       data.name,
        apiKey,               // shown once — merchant must store this securely
        createdAt:  data.created_at,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, description: 'Display name for the merchant / store' }),
      }),
    },
  );
