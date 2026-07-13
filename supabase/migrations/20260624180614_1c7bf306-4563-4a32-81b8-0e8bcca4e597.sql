
-- Create default admin user
DO $$
DECLARE
  admin_id uuid;
  admin_email text := 'admin@elwadi.com';
  admin_password text := 'Admin@2026';
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      admin_email, crypt(admin_password, gen_salt('bf')),
      now(), now(), now(),
      jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
      jsonb_build_object('full_name','مدير المتجر'),
      false, '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_id, jsonb_build_object('sub', admin_id::text, 'email', admin_email), 'email', admin_id::text, now(), now(), now());
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
