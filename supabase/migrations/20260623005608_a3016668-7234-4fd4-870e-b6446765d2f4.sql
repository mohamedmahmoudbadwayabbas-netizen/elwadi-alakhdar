
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_reference text;

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS instapay_handle text,
  ADD COLUMN IF NOT EXISTS bank_account_info text;
