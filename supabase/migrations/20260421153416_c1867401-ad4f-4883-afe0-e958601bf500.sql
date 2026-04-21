-- Enable realtime for app_users
ALTER TABLE public.app_users REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;