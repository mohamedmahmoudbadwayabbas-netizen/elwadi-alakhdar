
DO $$
DECLARE
  admin_uid uuid;
  existing_uid uuid;
BEGIN
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'admin@elwadi.com';
  IF existing_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated',
      'admin@elwadi.com', crypt('Admin@2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin"}'::jsonb,
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_uid, jsonb_build_object('sub', admin_uid::text, 'email', 'admin@elwadi.com', 'email_verified', true), 'email', admin_uid::text, now(), now(), now());
  ELSE
    admin_uid := existing_uid;
    UPDATE auth.users SET encrypted_password = crypt('Admin@2026', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now() WHERE id = admin_uid;
  END IF;

  INSERT INTO public.profiles (id, full_name) VALUES (admin_uid, 'Admin') ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
END $$;
