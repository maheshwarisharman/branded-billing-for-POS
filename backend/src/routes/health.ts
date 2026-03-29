/**
 * routes/health.ts — GET /health
 *
 * Called by the daemon's "Test Connection" button to verify the backend URL
 * is reachable. No auth required.
 */

import Elysia from 'elysia';

export const healthRoutes = new Elysia().get('/health', () => ({
  ok:        true,
  service:   'billdrop-backend',
  timestamp: new Date().toISOString(),
}));
