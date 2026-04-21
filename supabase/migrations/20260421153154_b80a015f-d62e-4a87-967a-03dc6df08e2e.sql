-- Department enum + column
DO $$ BEGIN
  CREATE TYPE public.app_department AS ENUM ('all', 'bar512', 'konferencje', 'polskie_smaki');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS department public.app_department NOT NULL DEFAULT 'all';

-- Drop functions whose return shapes / signatures change
DROP FUNCTION IF EXISTS public.admin_list_users(uuid);
DROP FUNCTION IF EXISTS public.verify_user_login(text, text);
DROP FUNCTION IF EXISTS public.admin_create_user(uuid, text, text, app_role);
DROP FUNCTION IF EXISTS public.admin_update_role(uuid, uuid, app_role);

-- admin_list_users — fix ambiguity, include department, restrict to global admins
CREATE FUNCTION public.admin_list_users(_admin_id uuid)
 RETURNS TABLE(id uuid, username text, role app_role, department app_department, created_at timestamptz)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE u.id = _admin_id AND u.role = 'admin' AND u.department = 'all'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT u.id, u.username, u.role, u.department, u.created_at
  FROM public.app_users u
  ORDER BY u.username;
END;
$function$;

-- verify_user_login — include department
CREATE FUNCTION public.verify_user_login(_username text, _password text)
 RETURNS TABLE(id uuid, username text, role app_role, department app_department)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.role, u.department
  FROM public.app_users u
  WHERE lower(u.username) = lower(_username)
    AND u.password_hash = extensions.crypt(_password, u.password_hash);
END;
$function$;

-- admin_create_user with department
CREATE FUNCTION public.admin_create_user(
  _admin_id uuid, _username text, _password text,
  _role app_role, _department app_department DEFAULT 'all'
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE u.id = _admin_id AND u.role = 'admin' AND u.department = 'all'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF length(trim(_username)) < 2 THEN RAISE EXCEPTION 'Username too short'; END IF;
  IF length(_password) < 4 THEN RAISE EXCEPTION 'Password too short'; END IF;

  INSERT INTO public.app_users (username, password_hash, role, department)
  VALUES (trim(_username), extensions.crypt(_password, extensions.gen_salt('bf', 10)), _role, _department)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$function$;

-- admin_update_role — also updates department
CREATE FUNCTION public.admin_update_role(
  _admin_id uuid, _user_id uuid, _new_role app_role, _new_department app_department DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE u.id = _admin_id AND u.role = 'admin' AND u.department = 'all'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _new_role = 'staff' THEN
    IF (SELECT count(*) FROM public.app_users WHERE role = 'admin' AND department = 'all' AND id <> _user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot demote the last global admin';
    END IF;
  END IF;
  UPDATE public.app_users
  SET role = _new_role,
      department = COALESCE(_new_department, department)
  WHERE id = _user_id;
END;
$function$;

-- Lock down update_password + delete to global admins
CREATE OR REPLACE FUNCTION public.admin_update_password(_admin_id uuid, _user_id uuid, _new_password text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE u.id = _admin_id AND u.role = 'admin' AND u.department = 'all'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF length(_new_password) < 4 THEN RAISE EXCEPTION 'Password too short'; END IF;
  UPDATE public.app_users
  SET password_hash = extensions.crypt(_new_password, extensions.gen_salt('bf', 10))
  WHERE id = _user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(_admin_id uuid, _user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE u.id = _admin_id AND u.role = 'admin' AND u.department = 'all'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _admin_id = _user_id THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;
  IF (SELECT role FROM public.app_users WHERE id = _user_id) = 'admin'
     AND (SELECT department FROM public.app_users WHERE id = _user_id) = 'all' THEN
    IF (SELECT count(*) FROM public.app_users WHERE role = 'admin' AND department = 'all' AND id <> _user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last global admin';
    END IF;
  END IF;
  DELETE FROM public.app_users WHERE id = _user_id;
END;
$function$;