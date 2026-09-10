ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payu_txnid TEXT,
  ADD COLUMN IF NOT EXISTS payu_payment_id TEXT;

CREATE INDEX IF NOT EXISTS subscriptions_payu_txnid_idx ON public.subscriptions (payu_txnid);