-- 1) Public "pulse" table so the storefront can react to settings changes in realtime
--    without exposing any sensitive store_settings column to anonymous clients.
CREATE TABLE IF NOT EXISTS public.store_settings_pulse (
  id smallint PRIMARY KEY DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_pulse_single_row CHECK (id = 1)
);

GRANT SELECT ON public.store_settings_pulse TO anon, authenticated;
GRANT ALL ON public.store_settings_pulse TO service_role;

ALTER TABLE public.store_settings_pulse ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pulse public read" ON public.store_settings_pulse;
CREATE POLICY "pulse public read" ON public.store_settings_pulse
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.store_settings_pulse (id, updated_at)
VALUES (1, now())
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION private.bump_store_settings_pulse()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.store_settings_pulse (id, updated_at)
  VALUES (1, now())
  ON CONFLICT (id) DO UPDATE SET updated_at = now();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS store_settings_pulse_trg ON public.store_settings;
CREATE TRIGGER store_settings_pulse_trg
AFTER INSERT OR UPDATE ON public.store_settings
FOR EACH STATEMENT EXECUTE FUNCTION private.bump_store_settings_pulse();

-- 2) Realtime
ALTER TABLE public.store_settings_pulse REPLICA IDENTITY FULL;
ALTER TABLE public.theme_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'store_settings_pulse'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings_pulse;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'theme_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.theme_settings;
  END IF;
END $$;

-- 3) Household / cleaning category for the template catalogue
INSERT INTO public.categories (name, slug, icon, sort_order)
SELECT 'منظفات ومنزل', 'cleaning', '🧼', 6
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'cleaning');
