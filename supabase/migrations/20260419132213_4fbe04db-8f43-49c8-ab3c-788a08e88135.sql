-- Drop unused stock-tracking columns and add low-stock flag fields across all 3 inventory tables

ALTER TABLE public.inventory_items
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN IF EXISTS min_stock,
  DROP COLUMN IF EXISTS used_this_shift,
  ADD COLUMN IF NOT EXISTS needs_restock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restock_note text,
  ADD COLUMN IF NOT EXISTS flagged_at timestamp with time zone;

ALTER TABLE public.inventory_items_konferencje
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN IF EXISTS min_stock,
  DROP COLUMN IF EXISTS used_this_shift,
  ADD COLUMN IF NOT EXISTS needs_restock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restock_note text,
  ADD COLUMN IF NOT EXISTS flagged_at timestamp with time zone;

ALTER TABLE public.inventory_items_polskie_smaki
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN IF EXISTS min_stock,
  DROP COLUMN IF EXISTS used_this_shift,
  ADD COLUMN IF NOT EXISTS needs_restock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restock_note text,
  ADD COLUMN IF NOT EXISTS flagged_at timestamp with time zone;