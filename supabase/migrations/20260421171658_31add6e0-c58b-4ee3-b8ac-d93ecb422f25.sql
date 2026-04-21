ALTER TABLE public.reservations_polskie_smaki
  ADD COLUMN IF NOT EXISTS created_by_username text;