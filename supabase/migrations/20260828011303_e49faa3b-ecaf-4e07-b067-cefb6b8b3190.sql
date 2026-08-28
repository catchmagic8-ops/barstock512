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

  INSERT INTO public.app_users (username, password_hash, role, department)
  VALUES (trim(_username), extensions.crypt(_password, extensions.gen_salt('bf', 10)), 'staff', 'all')
  RETURNING app_users.id INTO new_id;

  RETURN QUERY
  SELECT u.id, u.username, u.role, u.department
  FROM public.app_users u WHERE u.id = new_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.self_register_user(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.self_register_user(text, text) TO anon, authenticated, service_role;