-- Drop price column
ALTER TABLE public.events DROP COLUMN IF EXISTS price;
ALTER TABLE public.events_konferencje DROP COLUMN IF EXISTS price;
ALTER TABLE public.events_polskie_smaki DROP COLUMN IF EXISTS price;

-- Add new columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS food_menu text,
  ADD COLUMN IF NOT EXISTS beverage_menu text,
  ADD COLUMN IF NOT EXISTS guest_count integer;

ALTER TABLE public.events_konferencje
  ADD COLUMN IF NOT EXISTS food_menu text,
  ADD COLUMN IF NOT EXISTS beverage_menu text,
  ADD COLUMN IF NOT EXISTS guest_count integer;

ALTER TABLE public.events_polskie_smaki
  ADD COLUMN IF NOT EXISTS food_menu text,
  ADD COLUMN IF NOT EXISTS beverage_menu text,
  ADD COLUMN IF NOT EXISTS guest_count integer;

-- Migrate existing categories to new tag set per department
UPDATE public.events SET category = 'Bar512';
UPDATE public.events_konferencje SET category = 'Conference';
UPDATE public.events_polskie_smaki SET category = 'Wave';

-- Update default category per department
ALTER TABLE public.events ALTER COLUMN category SET DEFAULT 'Bar512';
ALTER TABLE public.events_konferencje ALTER COLUMN category SET DEFAULT 'Conference';
ALTER TABLE public.events_polskie_smaki ALTER COLUMN category SET DEFAULT 'Wave';