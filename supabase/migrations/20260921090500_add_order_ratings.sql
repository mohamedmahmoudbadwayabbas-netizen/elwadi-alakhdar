-- Migration: Add order rating and feedback columns to orders table
-- Enables customers to rate completed/delivered orders from 1 to 5 stars

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS rating_feedback text,
ADD COLUMN IF NOT EXISTS rated_at timestamptz;

-- Index for analytics and filtering by rating
CREATE INDEX IF NOT EXISTS idx_orders_rating ON public.orders(rating);

-- RLS Policy: Ensure customers can update their own order ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Users can rate their own orders'
  ) THEN
    CREATE POLICY "Users can rate their own orders"
      ON public.orders FOR UPDATE
      USING (auth.uid() = user_id OR public.is_staff() OR public.is_admin())
      WITH CHECK (auth.uid() = user_id OR public.is_staff() OR public.is_admin());
  END IF;
END $$;
