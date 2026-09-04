drop policy if exists "store_assets_read" on storage.objects;
create policy "store_assets_read" on storage.objects
for select to anon, authenticated using (bucket_id = 'store-assets');

drop policy if exists "store_assets_admin_insert" on storage.objects;
create policy "store_assets_admin_insert" on storage.objects
for insert to authenticated with check (bucket_id = 'store-assets' and private.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "store_assets_admin_update" on storage.objects;
create policy "store_assets_admin_update" on storage.objects
for update to authenticated using (bucket_id = 'store-assets' and private.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "store_assets_admin_delete" on storage.objects;
create policy "store_assets_admin_delete" on storage.objects
for delete to authenticated using (bucket_id = 'store-assets' and private.has_role(auth.uid(), 'admin'::app_role));