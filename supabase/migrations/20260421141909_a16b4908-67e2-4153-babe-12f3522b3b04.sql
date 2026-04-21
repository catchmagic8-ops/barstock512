-- Enable pgcrypto for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- App users table (custom, not tied to auth.users — username-only auth per product spec)
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- No direct client access to password hashes; all access goes through SECURITY DEFINER RPCs below.
-- Deny-all by default (no policies = no access for anon/authenticated).

CREATE TRIGGER trg_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- RPCs ----------

-- Verify credentials, return id/username/role on success, NULL row on failure
CREATE OR REPLACE FUNCTION public.verify_user_login(_username text, _password text)
RETURNS TABLE(id uuid, username text, role public.app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.role
  FROM public.app_users u
  WHERE lower(u.username) = lower(_username)
    AND u.password_hash = crypt(_password, u.password_hash);
END;
$$;

-- List users (admin only — caller must provide their own id; we re-check role server-side)
CREATE OR REPLACE FUNCTION public.admin_list_users(_admin_id uuid)
RETURNS TABLE(id uuid, username text, role public.app_role, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT u.id, u.username, u.role, u.created_at
  FROM public.app_users u
  ORDER BY u.username;
END;
$$;

-- Create user
CREATE OR REPLACE FUNCTION public.admin_create_user(_admin_id uuid, _username text, _password text, _role public.app_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF length(trim(_username)) < 2 THEN RAISE EXCEPTION 'Username too short'; END IF;
  IF length(_password) < 4 THEN RAISE EXCEPTION 'Password too short'; END IF;

  INSERT INTO public.app_users (username, password_hash, role)
  VALUES (trim(_username), crypt(_password, gen_salt('bf', 10)), _role)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Update password
CREATE OR REPLACE FUNCTION public.admin_update_password(_admin_id uuid, _user_id uuid, _new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF length(_new_password) < 4 THEN RAISE EXCEPTION 'Password too short'; END IF;
  UPDATE public.app_users
  SET password_hash = crypt(_new_password, gen_salt('bf', 10))
  WHERE id = _user_id;
END;
$$;

-- Update role
CREATE OR REPLACE FUNCTION public.admin_update_role(_admin_id uuid, _user_id uuid, _new_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  -- Prevent demoting the last admin
  IF _new_role = 'staff' THEN
    IF (SELECT count(*) FROM public.app_users WHERE role = 'admin' AND id <> _user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot demote the last admin';
    END IF;
  END IF;
  UPDATE public.app_users SET role = _new_role WHERE id = _user_id;
END;
$$;

-- Delete user
CREATE OR REPLACE FUNCTION public.admin_delete_user(_admin_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _admin_id = _user_id THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;
  -- Don't delete the last admin
  IF (SELECT role FROM public.app_users WHERE id = _user_id) = 'admin' THEN
    IF (SELECT count(*) FROM public.app_users WHERE role = 'admin' AND id <> _user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last admin';
    END IF;
  END IF;
  DELETE FROM public.app_users WHERE id = _user_id;
END;
$$;

-- Seed default users
INSERT INTO public.app_users (username, password_hash, role)
VALUES
  ('admin', crypt('admin512', gen_salt('bf', 10)), 'admin'),
  ('staff', crypt('staff512', gen_salt('bf', 10)), 'staff')
ON CONFLICT (username) DO NOTHING;
