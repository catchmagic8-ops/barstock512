-- Ensure pgcrypto is installed in the extensions schema (standard for Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update functions to include extensions in search_path so crypt()/gen_salt() resolve
CREATE OR REPLACE FUNCTION public.verify_user_login(_username text, _password text)
 RETURNS TABLE(id uuid, username text, role app_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.role
  FROM public.app_users u
  WHERE lower(u.username) = lower(_username)
    AND u.password_hash = extensions.crypt(_password, u.password_hash);
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_create_user(_admin_id uuid, _username text, _password text, _role app_role)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF length(trim(_username)) < 2 THEN RAISE EXCEPTION 'Username too short'; END IF;
  IF length(_password) < 4 THEN RAISE EXCEPTION 'Password too short'; END IF;

  INSERT INTO public.app_users (username, password_hash, role)
  VALUES (trim(_username), extensions.crypt(_password, extensions.gen_salt('bf', 10)), _role)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_password(_admin_id uuid, _user_id uuid, _new_password text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = _admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF length(_new_password) < 4 THEN RAISE EXCEPTION 'Password too short'; END IF;
  UPDATE public.app_users
  SET password_hash = extensions.crypt(_new_password, extensions.gen_salt('bf', 10))
  WHERE id = _user_id;
END;
$function$;

-- Re-seed default admin/staff with freshly hashed passwords (in case prior hashes are bad)
UPDATE public.app_users
SET password_hash = extensions.crypt('admin512', extensions.gen_salt('bf', 10))
WHERE lower(username) = 'admin';

UPDATE public.app_users
SET password_hash = extensions.crypt('staff512', extensions.gen_salt('bf', 10))
WHERE lower(username) = 'staff';

-- Insert defaults if they don't exist yet
INSERT INTO public.app_users (username, password_hash, role)
SELECT 'admin', extensions.crypt('admin512', extensions.gen_salt('bf', 10)), 'admin'::app_role
WHERE NOT EXISTS (SELECT 1 FROM public.app_users WHERE lower(username) = 'admin');

INSERT INTO public.app_users (username, password_hash, role)
SELECT 'staff', extensions.crypt('staff512', extensions.gen_salt('bf', 10)), 'staff'::app_role
WHERE NOT EXISTS (SELECT 1 FROM public.app_users WHERE lower(username) = 'staff');