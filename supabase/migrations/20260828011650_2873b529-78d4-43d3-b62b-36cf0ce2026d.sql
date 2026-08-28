ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true;

UPDATE public.app_users SET approved = true WHERE approved IS DISTINCT FROM true;

-- Self registration: pending approval
CREATE OR REPLACE FUNCTION public.self_register_user(_username text, _password text)
RETURNS TABLE(id uuid, username text, role app_role, department app_department)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  IF length(trim(_username)) < 2 THEN RAISE EXCEPTION 'Username too short'; END IF;
  IF length(_password) < 4 THEN RAISE EXCEPTION 'Password too short'; END IF;
  IF EXISTS (SELECT 1 FROM public.app_users u WHERE lower(u.username) = lower(trim(_username))) THEN
    RAISE EXCEPTION 'Username already taken';
  END IF;

  INSERT INTO public.app_users (username, password_hash, role, department, approved)
  VALUES (trim(_username), extensions.crypt(_password, extensions.gen_salt('bf', 10)), 'staff', 'all', false)
  RETURNING app_users.id INTO new_id;

  RETURN QUERY
  SELECT u.id, u.username, u.role, u.department
  FROM public.app_users u WHERE u.id = new_id;
END;
$function$;

-- Login: only approved accounts
CREATE OR REPLACE FUNCTION public.verify_user_login(_username text, _password text)
RETURNS TABLE(id uuid, username text, role app_role, department app_department)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.app_users u
    WHERE lower(u.username) = lower(_username)
      AND u.password_hash = extensions.crypt(_password, u.password_hash)
      AND u.approved = false
  ) THEN
    RAISE EXCEPTION 'Account pending approval';
  END IF;

  RETURN QUERY
  SELECT u.id, u.username, u.role, u.department
  FROM public.app_users u
  WHERE lower(u.username) = lower(_username)
    AND u.password_hash = extensions.crypt(_password, u.password_hash)
    AND u.approved = true;
END;
$function$;

-- Admin creates approved accounts
CREATE OR REPLACE FUNCTION public.admin_create_user(_admin_id uuid, _username text, _password text, _role app_role, _department app_department DEFAULT 'all'::app_department)
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

  INSERT INTO public.app_users (username, password_hash, role, department, approved)
  VALUES (trim(_username), extensions.crypt(_password, extensions.gen_salt('bf', 10)), _role, _department, true)
  RETURNING app_users.id INTO new_id;
  RETURN new_id;
END;
$function$;

-- Admin list includes approval state
DROP FUNCTION IF EXISTS public.admin_list_users(uuid);
CREATE OR REPLACE FUNCTION public.admin_list_users(_admin_id uuid)
RETURNS TABLE(id uuid, username text, role app_role, department app_department, approved boolean, created_at timestamp with time zone)
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
  SELECT u.id, u.username, u.role, u.department, u.approved, u.created_at
  FROM public.app_users u
  ORDER BY u.approved, u.username;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_set_approved(_admin_id uuid, _user_id uuid, _approved boolean)
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
    RAISE EXCEPTION 'Cannot change your own access';
  END IF;
  UPDATE public.app_users SET approved = _approved WHERE id = _user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_approved(uuid, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_approved(uuid, uuid, boolean) TO anon, authenticated, service_role;