ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS counting_location text;
ALTER TABLE public.inventory_items_konferencje ADD COLUMN IF NOT EXISTS counting_location text;
ALTER TABLE public.inventory_items_polskie_smaki ADD COLUMN IF NOT EXISTS counting_location text;