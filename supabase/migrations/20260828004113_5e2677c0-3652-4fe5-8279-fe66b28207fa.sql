ALTER TABLE public.handover_notes
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.handover_notes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS handover_notes_parent_id_idx ON public.handover_notes(parent_id);

ALTER TABLE public.handover_notes REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'handover_notes'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.handover_notes';
  END IF;
END $$;