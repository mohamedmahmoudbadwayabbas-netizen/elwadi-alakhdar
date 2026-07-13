
-- Seed admin user directly into auth schema
DO $$
DECLARE
  v_user_id uuid := '00000000-0000-0000-0000-00000000a001';
  v_email text := 'admin@elwadi.com';
  v_password text := 'Admin@2026';
  v_hashed text;
BEGIN
  v_hashed := crypt(v_password, gen_salt('bf'));

  -- Upsert auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    UPDATE auth.users
       SET encrypted_password = v_hashed,
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           updated_at = now()
     WHERE email = v_email
     RETURNING id INTO v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      v_hashed,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
  END IF;

  -- Identity row (required for email/password login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    'email',
    v_user_id::text,
    now(), now(), now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, full_name)
  VALUES (v_user_id, 'Admin')
  ON CONFLICT (id) DO NOTHING;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
