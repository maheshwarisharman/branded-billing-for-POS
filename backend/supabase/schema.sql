-- ─── BillDrop Backend — Supabase Schema ───────────────────────────────────────
-- Run this once in the Supabase SQL editor.

-- Merchants (one row per POS merchant / store)
CREATE TABLE IF NOT EXISTS merchants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  api_key     TEXT NOT NULL UNIQUE,      -- sent as `merchantKey` by the daemon
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bills (one row per uploaded PDF invoice)
CREATE TABLE IF NOT EXISTS bills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  s3_key      TEXT NOT NULL,             -- S3 object key for the stored PDF
  phone       TEXT,                      -- extracted from PDF, may be null
  name        TEXT,                      -- customer name, may be null
  order_id    TEXT,                      -- invoice/order ID, may be null
  status      TEXT NOT NULL DEFAULT 'received'
                CHECK (status IN ('received', 'processing', 'done', 'failed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bills_merchant    ON bills(merchant_id);
CREATE INDEX IF NOT EXISTS idx_bills_order_id    ON bills(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_phone       ON bills(phone);
CREATE INDEX IF NOT EXISTS idx_bills_created_at  ON bills(created_at DESC);
