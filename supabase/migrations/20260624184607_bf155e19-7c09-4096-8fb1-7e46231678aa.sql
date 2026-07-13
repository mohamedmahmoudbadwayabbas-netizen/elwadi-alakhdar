DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.products; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.categories; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.flash_offers; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.flash_offers REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;