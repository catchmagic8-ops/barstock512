
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS category text, ADD COLUMN IF NOT EXISTS extension text;
ALTER TABLE public.contacts_konferencje ADD COLUMN IF NOT EXISTS category text, ADD COLUMN IF NOT EXISTS extension text;
ALTER TABLE public.contacts_polskie_smaki ADD COLUMN IF NOT EXISTS category text, ADD COLUMN IF NOT EXISTS extension text;
