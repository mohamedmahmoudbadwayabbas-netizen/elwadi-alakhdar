ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_rating numeric(2,1) NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS reviews_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cooking_tip text,
ADD COLUMN IF NOT EXISTS is_top_seller boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.increment_product_views(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_product_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_product_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_product_views(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sync_product_reviews_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  calc_count integer;
  calc_avg numeric(2,1);
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.product_id;
  ELSE
    target_id := NEW.product_id;
  END IF;

  SELECT COUNT(*), COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0)
  INTO calc_count, calc_avg
  FROM public.reviews
  WHERE product_id = target_id;

  UPDATE public.products
  SET reviews_count = calc_count,
      avg_rating = calc_avg
  WHERE id = target_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_product_reviews ON public.reviews;
CREATE TRIGGER trigger_sync_product_reviews
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_reviews_stats();

-- Purchases are stored as jsonb items on public.orders (no order_items table)
CREATE OR REPLACE FUNCTION public.sync_order_purchase_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected uuid;
BEGIN
  FOR affected IN
    SELECT DISTINCT (elem->>'id')::uuid
    FROM jsonb_array_elements(
      COALESCE(CASE WHEN TG_OP <> 'INSERT' THEN OLD.items END, '[]'::jsonb)
      || COALESCE(CASE WHEN TG_OP <> 'DELETE' THEN NEW.items END, '[]'::jsonb)
    ) AS elem
    WHERE (elem->>'id') ~ '^[0-9a-fA-F-]{36}$'
  LOOP
    UPDATE public.products p
    SET purchase_count = COALESCE((
      SELECT SUM(COALESCE((elem->>'quantity')::numeric, 1))::integer
      FROM public.orders o, jsonb_array_elements(o.items) AS elem
      WHERE (elem->>'id') = affected::text
    ), 0)
    WHERE p.id = affected;
  END LOOP;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_order_purchases ON public.orders;
CREATE TRIGGER trigger_sync_order_purchases
AFTER INSERT OR UPDATE OF items OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_order_purchase_stats();

-- Backfill existing stats
UPDATE public.products p
SET reviews_count = s.cnt,
    avg_rating = s.avg_r
FROM (
  SELECT product_id, COUNT(*)::integer AS cnt, COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0) AS avg_r
  FROM public.reviews GROUP BY product_id
) s
WHERE p.id = s.product_id;

UPDATE public.products p
SET purchase_count = s.total
FROM (
  SELECT (elem->>'id') AS pid, SUM(COALESCE((elem->>'quantity')::numeric, 1))::integer AS total
  FROM public.orders o, jsonb_array_elements(o.items) AS elem
  WHERE (elem->>'id') ~ '^[0-9a-fA-F-]{36}$'
  GROUP BY 1
) s
WHERE p.id::text = s.pid;

ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;