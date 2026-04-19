-- Konferencje department tables
CREATE TABLE public.inventory_items_konferencje (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  unit text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  used_this_shift integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_items_konferencje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view inventory_k" ON public.inventory_items_konferencje FOR SELECT USING (true);
CREATE POLICY "Anyone can insert inventory_k" ON public.inventory_items_konferencje FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update inventory_k" ON public.inventory_items_konferencje FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete inventory_k" ON public.inventory_items_konferencje FOR DELETE USING (true);
CREATE TRIGGER update_inventory_items_konferencje_updated_at BEFORE UPDATE ON public.inventory_items_konferencje FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.events_konferencje (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time without time zone,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  category text DEFAULT 'general',
  price numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.events_konferencje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events_k" ON public.events_konferencje FOR SELECT USING (true);
CREATE POLICY "Anyone can insert events_k" ON public.events_konferencje FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update events_k" ON public.events_konferencje FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete events_k" ON public.events_konferencje FOR DELETE USING (true);
CREATE TRIGGER update_events_konferencje_updated_at BEFORE UPDATE ON public.events_konferencje FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.recipes_konferencje (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'cocktail',
  ingredients text NOT NULL,
  instructions text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.recipes_konferencje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view recipes_k" ON public.recipes_konferencje FOR SELECT USING (true);
CREATE POLICY "Anyone can insert recipes_k" ON public.recipes_konferencje FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update recipes_k" ON public.recipes_konferencje FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete recipes_k" ON public.recipes_konferencje FOR DELETE USING (true);
CREATE TRIGGER update_recipes_konferencje_updated_at BEFORE UPDATE ON public.recipes_konferencje FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contacts_konferencje (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  phone text,
  email text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts_konferencje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view contacts_k" ON public.contacts_konferencje FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contacts_k" ON public.contacts_konferencje FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update contacts_k" ON public.contacts_konferencje FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete contacts_k" ON public.contacts_konferencje FOR DELETE USING (true);
CREATE TRIGGER update_contacts_konferencje_updated_at BEFORE UPDATE ON public.contacts_konferencje FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.subcategories_konferencje (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.subcategories_konferencje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subcategories_k" ON public.subcategories_konferencje FOR SELECT USING (true);
CREATE POLICY "Anyone can insert subcategories_k" ON public.subcategories_konferencje FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update subcategories_k" ON public.subcategories_konferencje FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete subcategories_k" ON public.subcategories_konferencje FOR DELETE USING (true);

-- Polskie Smaki department tables
CREATE TABLE public.inventory_items_polskie_smaki (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  unit text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  used_this_shift integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_items_polskie_smaki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view inventory_p" ON public.inventory_items_polskie_smaki FOR SELECT USING (true);
CREATE POLICY "Anyone can insert inventory_p" ON public.inventory_items_polskie_smaki FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update inventory_p" ON public.inventory_items_polskie_smaki FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete inventory_p" ON public.inventory_items_polskie_smaki FOR DELETE USING (true);
CREATE TRIGGER update_inventory_items_polskie_smaki_updated_at BEFORE UPDATE ON public.inventory_items_polskie_smaki FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.events_polskie_smaki (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time without time zone,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  category text DEFAULT 'general',
  price numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.events_polskie_smaki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events_p" ON public.events_polskie_smaki FOR SELECT USING (true);
CREATE POLICY "Anyone can insert events_p" ON public.events_polskie_smaki FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update events_p" ON public.events_polskie_smaki FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete events_p" ON public.events_polskie_smaki FOR DELETE USING (true);
CREATE TRIGGER update_events_polskie_smaki_updated_at BEFORE UPDATE ON public.events_polskie_smaki FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.recipes_polskie_smaki (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'cocktail',
  ingredients text NOT NULL,
  instructions text NOT NULL,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.recipes_polskie_smaki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view recipes_p" ON public.recipes_polskie_smaki FOR SELECT USING (true);
CREATE POLICY "Anyone can insert recipes_p" ON public.recipes_polskie_smaki FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update recipes_p" ON public.recipes_polskie_smaki FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete recipes_p" ON public.recipes_polskie_smaki FOR DELETE USING (true);
CREATE TRIGGER update_recipes_polskie_smaki_updated_at BEFORE UPDATE ON public.recipes_polskie_smaki FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.contacts_polskie_smaki (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  phone text,
  email text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts_polskie_smaki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view contacts_p" ON public.contacts_polskie_smaki FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contacts_p" ON public.contacts_polskie_smaki FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update contacts_p" ON public.contacts_polskie_smaki FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete contacts_p" ON public.contacts_polskie_smaki FOR DELETE USING (true);
CREATE TRIGGER update_contacts_polskie_smaki_updated_at BEFORE UPDATE ON public.contacts_polskie_smaki FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.subcategories_polskie_smaki (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.subcategories_polskie_smaki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subcategories_p" ON public.subcategories_polskie_smaki FOR SELECT USING (true);
CREATE POLICY "Anyone can insert subcategories_p" ON public.subcategories_polskie_smaki FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update subcategories_p" ON public.subcategories_polskie_smaki FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete subcategories_p" ON public.subcategories_polskie_smaki FOR DELETE USING (true);