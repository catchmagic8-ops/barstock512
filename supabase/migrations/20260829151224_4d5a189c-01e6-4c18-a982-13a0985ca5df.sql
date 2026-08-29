CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  username text,
  role text NOT NULL DEFAULT 'staff',
  platform text NOT NULL DEFAULT 'web',
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view push tokens" ON public.push_tokens FOR SELECT USING (true);
CREATE POLICY "Anyone can insert push tokens" ON public.push_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update push tokens" ON public.push_tokens FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete push tokens" ON public.push_tokens FOR DELETE USING (true);

CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();