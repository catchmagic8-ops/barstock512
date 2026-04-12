
-- Add image_url column to recipes
ALTER TABLE public.recipes ADD COLUMN image_url TEXT;

-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true);

-- Public read access
CREATE POLICY "Recipe images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

-- Anyone can upload
CREATE POLICY "Anyone can upload recipe images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recipe-images');

-- Anyone can delete
CREATE POLICY "Anyone can delete recipe images"
ON storage.objects FOR DELETE
USING (bucket_id = 'recipe-images');
