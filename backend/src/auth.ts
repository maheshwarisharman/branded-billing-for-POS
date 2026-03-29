/**
 * auth.ts — Merchant API-key resolution.
 *
 * The daemon sends the key as a multipart form field (`merchantKey`) on ingest.
 * All other routes receive it via the `Authorization: Bearer <key>` header.
 *
 * This module provides a single helper that turns a raw key string into a
 * resolved MerchantRow (or null on miss), plus an Elysia derive plugin that
 * injects `merchant` into the request context for protected routes.
 */

import Elysia from 'elysia';
import { supabase, type MerchantRow } from './supabase';

/**
 * Look up a merchant by API key.
 * Returns null if the key is invalid or not found.
 */
export async function resolveMerchant(apiKey: string): Promise<MerchantRow | null> {
  if (!apiKey) return null;

  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !data) return null;
  return data as MerchantRow;
}

/**
 * Extract the Bearer token from an Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearer(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0]!.toLowerCase() !== 'bearer') return null;
  return parts[1] ?? null;
}

/**
 * Elysia plugin — derive `merchant` from the Authorization header.
 * Use on any route group that requires merchant auth.
 *
 * Returns a 401 Response if the key is missing or invalid.
 */
export const merchantAuth = new Elysia({ name: 'merchant-auth' }).derive(
  { as: 'scoped' },
  async ({ headers, set }): Promise<{ merchant: MerchantRow | null }> => {
    const key = extractBearer(headers['authorization']);

    if (!key) {
      set.status = 401;
      return { merchant: null };
    }

    const merchant = await resolveMerchant(key);

    if (!merchant) {
      set.status = 401;
      return { merchant: null };
    }

    return { merchant };
  },
);
