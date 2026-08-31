ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS additional_locations text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.inventory_items_konferencje ADD COLUMN IF NOT EXISTS additional_locations text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.inventory_items_polskie_smaki ADD COLUMN IF NOT EXISTS additional_locations text[] NOT NULL DEFAULT '{}';