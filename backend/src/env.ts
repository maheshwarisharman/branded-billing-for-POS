/**
 * env.ts — Validates and exports all required environment variables at startup.
 * Throws immediately if a required variable is missing so failures are obvious.
 */

function required(key: string): string {
  const val = Bun.env[key];
  if (!val) throw new Error(`[env] Missing required environment variable: ${key}`);
  return val;
}

export const env = {
  PORT:                      Number(Bun.env.PORT ?? 3000),
  SUPABASE_URL:              required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  AWS_ACCESS_KEY_ID:         required('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY:     required('AWS_SECRET_ACCESS_KEY'),
  AWS_REGION:                required('AWS_REGION'),
  AWS_S3_BUCKET:             required('AWS_S3_BUCKET'),
  ADMIN_KEY:                 required('ADMIN_KEY'),
} as const;
