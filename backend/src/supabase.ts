/**
 * supabase.ts — Singleton Supabase client using the service-role key.
 * Service-role bypasses RLS, which is correct for a trusted backend process.
 */

import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── Typed row shapes ─────────────────────────────────────────────────────────

export interface MerchantRow {
  id:         string;
  name:       string;
  api_key:    string;
  created_at: string;
}

export interface BillRow {
  id:          string;
  merchant_id: string;
  filename:    string;
  s3_key:      string;
  phone:       string | null;
  name:        string | null;
  order_id:    string | null;
  status:      'received' | 'processing' | 'done' | 'failed';
  created_at:  string;
}
