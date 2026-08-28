CREATE TABLE public.inventory_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department text NOT NULL,
  item_id text NOT NULL,
  item_name text NOT NULL,
  unit text,
  qty_before numeric,
  qty_after numeric,
  qty_to_order numeric,
  action text NOT NULL DEFAULT 'stocktake',
  note text,
  username text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_log TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_log TO authenticated;
GRANT ALL ON public.inventory_log TO service_role;

ALTER TABLE public.inventory_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory log" ON public.inventory_log FOR SELECT USING (true);
CREATE POLICY "Anyone can insert inventory log" ON public.inventory_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update inventory log" ON public.inventory_log FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete inventory log" ON public.inventory_log FOR DELETE USING (true);

CREATE TRIGGER update_inventory_log_updated_at BEFORE UPDATE ON public.inventory_log
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_inventory_log_dept_item ON public.inventory_log (department, item_id, created_at DESC);

ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS stock_confirmed_at timestamp with time zone;
ALTER TABLE public.inventory_items_konferencje ADD COLUMN IF NOT EXISTS stock_confirmed_at timestamp with time zone;
ALTER TABLE public.inventory_items_polskie_smaki ADD COLUMN IF NOT EXISTS stock_confirmed_at timestamp with time zone;