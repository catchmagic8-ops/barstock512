ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS storehouse text,
  ADD COLUMN IF NOT EXISTS qty_left numeric,
  ADD COLUMN IF NOT EXISTS qty_to_order numeric;

ALTER TABLE public.inventory_items_konferencje
  ADD COLUMN IF NOT EXISTS storehouse text,
  ADD COLUMN IF NOT EXISTS qty_left numeric,
  ADD COLUMN IF NOT EXISTS qty_to_order numeric;

ALTER TABLE public.inventory_items_polskie_smaki
  ADD COLUMN IF NOT EXISTS storehouse text,
  ADD COLUMN IF NOT EXISTS qty_left numeric,
  ADD COLUMN IF NOT EXISTS qty_to_order numeric;