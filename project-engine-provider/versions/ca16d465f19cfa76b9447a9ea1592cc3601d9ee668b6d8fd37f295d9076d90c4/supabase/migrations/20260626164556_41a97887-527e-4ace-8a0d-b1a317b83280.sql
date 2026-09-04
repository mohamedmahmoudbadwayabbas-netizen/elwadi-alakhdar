ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS hero_bg_image text,
  ADD COLUMN IF NOT EXISTS login_bg_pattern text,
  ADD COLUMN IF NOT EXISTS cart_empty_bg text,
  ADD COLUMN IF NOT EXISTS floating_element_image text;