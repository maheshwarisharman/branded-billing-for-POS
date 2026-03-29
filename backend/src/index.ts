/**
 * index.ts — BillDrop Backend entry point
 *
 * Spins up an Elysia server with:
 *   GET  /health
 *   POST /bills/ingest      ← called by the BillDrop daemon
 *   GET  /bills             ← merchant dashboard
 *   GET  /bills/:id         ← single bill + presigned PDF URL
 *   POST /merchants         ← admin provisioning
 */

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

import { env } from './env';
import { healthRoutes }   from './routes/health';
import { billRoutes }     from './routes/bills';
import { merchantRoutes } from './routes/merchants';

const app = new Elysia()
  // ── Global CORS ────────────────────────────────────────────────────────────
  .use(cors({
    origin:  true,                           // allow all origins; tighten in production
    methods: ['GET', 'POST', 'OPTIONS'],
  }))

  // ── Routes ─────────────────────────────────────────────────────────────────
  .use(healthRoutes)
  .use(billRoutes)
  .use(merchantRoutes)

  // ── Global error handler ───────────────────────────────────────────────────
  .onError(({ code, error, set }) => {
    const status =
      code === 'NOT_FOUND'             ? 404 :
      code === 'VALIDATION'            ? 422 :
      code === 'PARSE'                 ? 400 :
      code === 'INTERNAL_SERVER_ERROR' ? 500  : 500;

    set.status = status;

    const message = error instanceof Error ? error.message : String(error);
    console.error(`[error] ${code}:`, message);

    return { ok: false, code, message };
  })

  .listen(env.PORT);

console.log(`🚀  BillDrop Backend listening on http://localhost:${env.PORT}`);
console.log(`    POST /bills/ingest  — daemon ingestion`);
console.log(`    GET  /bills         — merchant bill list`);
console.log(`    GET  /bills/:id     — bill detail + presigned URL`);
console.log(`    POST /merchants     — admin provisioning`);

export type App = typeof app;
