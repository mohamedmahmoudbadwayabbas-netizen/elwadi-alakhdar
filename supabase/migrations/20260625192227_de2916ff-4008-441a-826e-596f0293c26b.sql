
-- Ensure trigger on new auth users creates profile + assigns default 'user' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed/repair the default admin account (idempotent)
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@elwadi.com';

  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      'admin@elwadi.com', crypt('Admin@2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin"}'::jsonb,
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@elwadi.com', 'email_verified', true),
      'email', admin_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Admin@2026', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now(),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb
    WHERE id = admin_id;
  END IF;

  -- Ensure profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (admin_id, 'Admin', '')
  ON CONFLICT (id) DO NOTHING;

  -- Ensure admin role (and remove conflicting 'user' role for clarity)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
