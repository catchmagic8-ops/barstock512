ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

CREATE OR REPLACE FUNCTION public.admin_update_role(_admin_id uuid, _user_id uuid, _new_role app_role, _new_department app_department DEFAULT NULL::app_department)
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
  IF _new_role <> 'admin' THEN
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