CREATE TABLE public.handover_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id uuid NOT NULL REFERENCES public.handover_notes(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  username text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (note_id, emoji, username)
);

GRANT SELECT, INSERT, DELETE ON public.handover_reactions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.handover_reactions TO anon;
GRANT ALL ON public.handover_reactions TO service_role;

ALTER TABLE public.handover_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are viewable by everyone"
  ON public.handover_reactions FOR SELECT USING (true);
CREATE POLICY "Anyone can add reactions"
  ON public.handover_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove reactions"
  ON public.handover_reactions FOR DELETE USING (true);

ALTER TABLE public.handover_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.handover_reactions;

CREATE INDEX idx_handover_reactions_note ON public.handover_reactions(note_id);