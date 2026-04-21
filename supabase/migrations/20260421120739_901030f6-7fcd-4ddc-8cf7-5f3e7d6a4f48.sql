-- A La Carte tables for Bar 512 and Polskie Smaki (Konferencje excluded)

CREATE TABLE public.a_la_carte_bar512 (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  name text NOT NULL,
  description text,
  allergens text[] NOT NULL DEFAULT '{}',
  dietary text[] NOT NULL DEFAULT '{}',
  price_pln numeric(10,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.a_la_carte_polskie_smaki (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  name text NOT NULL,
  description text,
  allergens text[] NOT NULL DEFAULT '{}',
  dietary text[] NOT NULL DEFAULT '{}',
  price_pln numeric(10,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.a_la_carte_bar512 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.a_la_carte_polskie_smaki ENABLE ROW LEVEL SECURITY;

-- Public access policies (matches existing project pattern)
CREATE POLICY "Anyone can view a_la_carte_bar512" ON public.a_la_carte_bar512 FOR SELECT USING (true);
CREATE POLICY "Anyone can insert a_la_carte_bar512" ON public.a_la_carte_bar512 FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update a_la_carte_bar512" ON public.a_la_carte_bar512 FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete a_la_carte_bar512" ON public.a_la_carte_bar512 FOR DELETE USING (true);

CREATE POLICY "Anyone can view a_la_carte_polskie_smaki" ON public.a_la_carte_polskie_smaki FOR SELECT USING (true);
CREATE POLICY "Anyone can insert a_la_carte_polskie_smaki" ON public.a_la_carte_polskie_smaki FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update a_la_carte_polskie_smaki" ON public.a_la_carte_polskie_smaki FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete a_la_carte_polskie_smaki" ON public.a_la_carte_polskie_smaki FOR DELETE USING (true);

-- updated_at triggers
CREATE TRIGGER update_a_la_carte_bar512_updated_at
  BEFORE UPDATE ON public.a_la_carte_bar512
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_a_la_carte_polskie_smaki_updated_at
  BEFORE UPDATE ON public.a_la_carte_polskie_smaki
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed identical placeholder menu into both tables
WITH seed AS (
  SELECT * FROM (VALUES
    ('Snacks & Nibbles', 'Marinated Olives', 'Mixed Nocellara and Kalamata olives, rosemary, garlic, lemon zest, chilli flakes', ARRAY[]::text[], ARRAY['Vegan']::text[], 22.00, 1),
    ('Snacks & Nibbles', 'Sourdough & Whipped Butter', 'House sourdough, whipped salted butter, fleur de sel', ARRAY['Gluten','Milk','Eggs']::text[], ARRAY['Vegetarian']::text[], 18.00, 2),
    ('Snacks & Nibbles', 'Truffle Parmesan Fries', 'Crispy thin-cut fries, truffle oil, grated Parmesan, fresh parsley', ARRAY['Gluten','Milk']::text[], ARRAY['Vegetarian']::text[], 32.00, 3),
    ('Snacks & Nibbles', 'Spiced Nuts Mix', 'Roasted cashews, almonds, pecans, smoked paprika, rosemary, sea salt', ARRAY['Tree Nuts']::text[], ARRAY['Vegan']::text[], 24.00, 4),
    ('Snacks & Nibbles', 'Charcuterie Board', 'Selection of cured meats (prosciutto, salami, coppa), cornichons, Dijon mustard, grissini', ARRAY['Gluten','Mustard']::text[], ARRAY[]::text[], 68.00, 5),

    ('Small Plates', 'Burrata', 'Fresh burrata, heritage tomatoes, basil oil, aged balsamic, sea salt, toasted focaccia', ARRAY['Milk','Gluten']::text[], ARRAY['Vegetarian']::text[], 52.00, 1),
    ('Small Plates', 'Beef Tartare', 'Hand-cut beef tenderloin, capers, shallots, Dijon mustard, egg yolk, toasted brioche', ARRAY['Eggs','Mustard','Gluten']::text[], ARRAY[]::text[], 58.00, 2),
    ('Small Plates', 'Smoked Salmon Blini', 'Cold-smoked Atlantic salmon, buckwheat blini, crème fraîche, dill, salmon roe', ARRAY['Fish','Milk','Eggs','Gluten']::text[], ARRAY[]::text[], 56.00, 3),
    ('Small Plates', 'Chicken Liver Pâté', 'Smooth chicken liver pâté, port wine reduction, toasted sourdough, pickled shallots', ARRAY['Milk','Gluten','Sulphites']::text[], ARRAY[]::text[], 48.00, 4),
    ('Small Plates', 'Crispy Calamari', 'Lightly breaded squid rings, smoked aioli, lemon, fresh herbs', ARRAY['Gluten','Eggs','Molluscs']::text[], ARRAY[]::text[], 46.00, 5),

    ('Sandwiches & Light Mains', 'Club Sandwich 512', 'Triple-decker with roasted chicken breast, streaky bacon, fried egg, lettuce, tomato, garlic mayo, toasted brioche', ARRAY['Gluten','Eggs','Milk','Mustard']::text[], ARRAY[]::text[], 62.00, 1),
    ('Sandwiches & Light Mains', 'Wagyu Beef Slider (x2)', 'Mini brioche buns, wagyu beef patty, aged cheddar, caramelised onions, truffle mayo, gherkin', ARRAY['Gluten','Milk','Eggs','Mustard']::text[], ARRAY[]::text[], 68.00, 2),
    ('Sandwiches & Light Mains', 'Croque Monsieur', 'Toasted sourdough, Comté cheese, Parisian ham, béchamel, side salad', ARRAY['Gluten','Milk','Eggs']::text[], ARRAY[]::text[], 54.00, 3),
    ('Sandwiches & Light Mains', 'Caesar Salad', 'Romaine lettuce, house Caesar dressing, Parmesan shavings, anchovy, sourdough croutons. Add: grilled chicken +18 PLN, smoked salmon +22 PLN', ARRAY['Eggs','Fish','Milk','Gluten']::text[], ARRAY[]::text[], 48.00, 4),

    ('Desserts', 'Chocolate Fondant', 'Warm dark chocolate fondant, vanilla bean ice cream, sea salt', ARRAY['Gluten','Eggs','Milk']::text[], ARRAY[]::text[], 38.00, 1),
    ('Desserts', 'Cheesecake', 'New York style baked cheesecake, seasonal berry compote, shortbread crumble', ARRAY['Gluten','Milk','Eggs']::text[], ARRAY[]::text[], 34.00, 2),
    ('Desserts', 'Seasonal Sorbet (x2 scoops)', 'Ask staff for today''s flavours', ARRAY['May contain traces of nuts']::text[], ARRAY['Vegan']::text[], 26.00, 3)
  ) AS t(category, name, description, allergens, dietary, price_pln, sort_order)
)
INSERT INTO public.a_la_carte_bar512 (category, name, description, allergens, dietary, price_pln, sort_order)
SELECT category, name, description, allergens, dietary, price_pln, sort_order FROM seed;

WITH seed AS (
  SELECT * FROM (VALUES
    ('Snacks & Nibbles', 'Marinated Olives', 'Mixed Nocellara and Kalamata olives, rosemary, garlic, lemon zest, chilli flakes', ARRAY[]::text[], ARRAY['Vegan']::text[], 22.00, 1),
    ('Snacks & Nibbles', 'Sourdough & Whipped Butter', 'House sourdough, whipped salted butter, fleur de sel', ARRAY['Gluten','Milk','Eggs']::text[], ARRAY['Vegetarian']::text[], 18.00, 2),
    ('Snacks & Nibbles', 'Truffle Parmesan Fries', 'Crispy thin-cut fries, truffle oil, grated Parmesan, fresh parsley', ARRAY['Gluten','Milk']::text[], ARRAY['Vegetarian']::text[], 32.00, 3),
    ('Snacks & Nibbles', 'Spiced Nuts Mix', 'Roasted cashews, almonds, pecans, smoked paprika, rosemary, sea salt', ARRAY['Tree Nuts']::text[], ARRAY['Vegan']::text[], 24.00, 4),
    ('Snacks & Nibbles', 'Charcuterie Board', 'Selection of cured meats (prosciutto, salami, coppa), cornichons, Dijon mustard, grissini', ARRAY['Gluten','Mustard']::text[], ARRAY[]::text[], 68.00, 5),

    ('Small Plates', 'Burrata', 'Fresh burrata, heritage tomatoes, basil oil, aged balsamic, sea salt, toasted focaccia', ARRAY['Milk','Gluten']::text[], ARRAY['Vegetarian']::text[], 52.00, 1),
    ('Small Plates', 'Beef Tartare', 'Hand-cut beef tenderloin, capers, shallots, Dijon mustard, egg yolk, toasted brioche', ARRAY['Eggs','Mustard','Gluten']::text[], ARRAY[]::text[], 58.00, 2),
    ('Small Plates', 'Smoked Salmon Blini', 'Cold-smoked Atlantic salmon, buckwheat blini, crème fraîche, dill, salmon roe', ARRAY['Fish','Milk','Eggs','Gluten']::text[], ARRAY[]::text[], 56.00, 3),
    ('Small Plates', 'Chicken Liver Pâté', 'Smooth chicken liver pâté, port wine reduction, toasted sourdough, pickled shallots', ARRAY['Milk','Gluten','Sulphites']::text[], ARRAY[]::text[], 48.00, 4),
    ('Small Plates', 'Crispy Calamari', 'Lightly breaded squid rings, smoked aioli, lemon, fresh herbs', ARRAY['Gluten','Eggs','Molluscs']::text[], ARRAY[]::text[], 46.00, 5),

    ('Sandwiches & Light Mains', 'Club Sandwich 512', 'Triple-decker with roasted chicken breast, streaky bacon, fried egg, lettuce, tomato, garlic mayo, toasted brioche', ARRAY['Gluten','Eggs','Milk','Mustard']::text[], ARRAY[]::text[], 62.00, 1),
    ('Sandwiches & Light Mains', 'Wagyu Beef Slider (x2)', 'Mini brioche buns, wagyu beef patty, aged cheddar, caramelised onions, truffle mayo, gherkin', ARRAY['Gluten','Milk','Eggs','Mustard']::text[], ARRAY[]::text[], 68.00, 2),
    ('Sandwiches & Light Mains', 'Croque Monsieur', 'Toasted sourdough, Comté cheese, Parisian ham, béchamel, side salad', ARRAY['Gluten','Milk','Eggs']::text[], ARRAY[]::text[], 54.00, 3),
    ('Sandwiches & Light Mains', 'Caesar Salad', 'Romaine lettuce, house Caesar dressing, Parmesan shavings, anchovy, sourdough croutons. Add: grilled chicken +18 PLN, smoked salmon +22 PLN', ARRAY['Eggs','Fish','Milk','Gluten']::text[], ARRAY[]::text[], 48.00, 4),

    ('Desserts', 'Chocolate Fondant', 'Warm dark chocolate fondant, vanilla bean ice cream, sea salt', ARRAY['Gluten','Eggs','Milk']::text[], ARRAY[]::text[], 38.00, 1),
    ('Desserts', 'Cheesecake', 'New York style baked cheesecake, seasonal berry compote, shortbread crumble', ARRAY['Gluten','Milk','Eggs']::text[], ARRAY[]::text[], 34.00, 2),
    ('Desserts', 'Seasonal Sorbet (x2 scoops)', 'Ask staff for today''s flavours', ARRAY['May contain traces of nuts']::text[], ARRAY['Vegan']::text[], 26.00, 3)
  ) AS t(category, name, description, allergens, dietary, price_pln, sort_order)
)
INSERT INTO public.a_la_carte_polskie_smaki (category, name, description, allergens, dietary, price_pln, sort_order)
SELECT category, name, description, allergens, dietary, price_pln, sort_order FROM seed;
