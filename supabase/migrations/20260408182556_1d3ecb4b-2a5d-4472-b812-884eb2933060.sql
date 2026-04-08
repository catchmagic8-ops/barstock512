
-- Create inventory items table
CREATE TABLE public.inventory_items (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  used_this_shift INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (no auth needed for this bar tool)
CREATE POLICY "Anyone can view inventory" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert inventory" ON public.inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update inventory" ON public.inventory_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete inventory" ON public.inventory_items FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
