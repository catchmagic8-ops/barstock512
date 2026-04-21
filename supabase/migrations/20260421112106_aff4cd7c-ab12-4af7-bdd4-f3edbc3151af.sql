ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.events_konferencje ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.events_polskie_smaki ADD COLUMN IF NOT EXISTS location text;