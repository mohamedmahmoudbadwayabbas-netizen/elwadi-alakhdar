
-- 1. Drop the SECURITY DEFINER helper that's no longer needed (admin already exists)
DROP FUNCTION IF EXISTS public.claim_admin_if_none();

-- 2. Rate limit anonymous order inserts
CREATE OR REPLACE FUNCTION public.enforce_order_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count int;
BEGIN
  IF NEW.phone IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO recent_count
  FROM public.orders
  WHERE phone = NEW.phone
    AND created_at > now() - interval '10 minutes';
  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many orders submitted recently. Please try again later.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_order_rate_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_orders_rate_limit ON public.orders;
CREATE TRIGGER trg_orders_rate_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_rate_limit();

-- 3. Remove sensitive tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.store_settings;
