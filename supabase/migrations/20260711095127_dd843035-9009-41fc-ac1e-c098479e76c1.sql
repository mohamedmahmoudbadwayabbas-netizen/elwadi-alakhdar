
-- Users can read their own orders
CREATE POLICY "orders_user_read_own"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can cancel their own orders only if not already shipped/completed/cancelled,
-- and only to change status to 'cancelled'.
CREATE POLICY "orders_user_cancel_own"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status NOT IN ('shipped', 'completed', 'cancelled', 'delivered', 'delivering')
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'cancelled'
  );

-- Enable realtime for orders (ignore if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
