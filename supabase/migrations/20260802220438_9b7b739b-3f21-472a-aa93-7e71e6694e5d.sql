CREATE OR REPLACE FUNCTION public.get_payment_config()
RETURNS TABLE(instapay_handle text, bank_account_info text, store_address text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  select * from private.get_payment_config()
$$;
