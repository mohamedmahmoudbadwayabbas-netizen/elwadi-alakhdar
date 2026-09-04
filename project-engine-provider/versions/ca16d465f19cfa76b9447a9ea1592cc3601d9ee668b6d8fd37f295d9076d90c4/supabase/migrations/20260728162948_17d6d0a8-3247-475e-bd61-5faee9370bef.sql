alter view public.store_settings_public set (security_invoker = false);
grant select on public.store_settings_public to anon, authenticated;

create or replace function public.get_payment_config()
returns table(instapay_handle text, bank_account_info text, store_address text)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select s.instapay_handle, s.bank_account_info, s.store_address
  from public.store_settings s
  limit 1
$function$;

revoke all on function public.get_payment_config() from public;
grant execute on function public.get_payment_config() to anon, authenticated;