ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS flagged_by text;
ALTER TABLE public.inventory_items_konferencje ADD COLUMN IF NOT EXISTS flagged_by text;
ALTER TABLE public.inventory_items_polskie_smaki ADD COLUMN IF NOT EXISTS flagged_by text;