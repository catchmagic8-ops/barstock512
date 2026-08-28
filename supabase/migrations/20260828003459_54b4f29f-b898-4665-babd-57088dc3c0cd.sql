CREATE TABLE public.handover_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department text NOT NULL,
  author_username text,
  category text NOT NULL DEFAULT 'Ogólne',
  message text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.handover_notes TO anon, authenticated;
GRANT ALL ON public.handover_notes TO service_role;

ALTER TABLE public.handover_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view handover notes" ON public.handover_notes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert handover notes" ON public.handover_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update handover notes" ON public.handover_notes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete handover notes" ON public.handover_notes FOR DELETE USING (true);

CREATE TRIGGER update_handover_notes_updated_at BEFORE UPDATE ON public.handover_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX handover_notes_dept_created_idx ON public.handover_notes (department, created_at DESC);