
CREATE TABLE public.upsell_items_bar512 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  image_url text,
  tasting_notes text,
  upsell_pitch text,
  pairing_suggestions text,
  price_tier text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.upsell_items_bar512 TO authenticated, anon;
GRANT ALL ON public.upsell_items_bar512 TO service_role;

ALTER TABLE public.upsell_items_bar512 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upsell_items_bar512_all_select" ON public.upsell_items_bar512 FOR SELECT USING (true);
CREATE POLICY "upsell_items_bar512_all_insert" ON public.upsell_items_bar512 FOR INSERT WITH CHECK (true);
CREATE POLICY "upsell_items_bar512_all_update" ON public.upsell_items_bar512 FOR UPDATE USING (true);
CREATE POLICY "upsell_items_bar512_all_delete" ON public.upsell_items_bar512 FOR DELETE USING (true);

CREATE TRIGGER upsell_items_bar512_updated_at
BEFORE UPDATE ON public.upsell_items_bar512
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
