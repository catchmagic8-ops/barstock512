
CREATE TABLE public.subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, category)
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert subcategories" ON public.subcategories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update subcategories" ON public.subcategories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete subcategories" ON public.subcategories FOR DELETE USING (true);

ALTER TABLE public.inventory_items ADD COLUMN subcategory TEXT;
