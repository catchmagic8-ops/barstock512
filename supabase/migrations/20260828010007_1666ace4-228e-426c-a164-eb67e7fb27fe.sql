CREATE TABLE public.quiz_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL DEFAULT 'gość',
  department text NOT NULL DEFAULT 'bar512',
  mode text NOT NULL DEFAULT 'untimed',
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  best_streak integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_results TO authenticated;
GRANT SELECT, INSERT ON public.quiz_results TO anon;
GRANT ALL ON public.quiz_results TO service_role;

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quiz results" ON public.quiz_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quiz results" ON public.quiz_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quiz results" ON public.quiz_results FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete quiz results" ON public.quiz_results FOR DELETE USING (true);

CREATE TRIGGER update_quiz_results_updated_at
BEFORE UPDATE ON public.quiz_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX quiz_results_username_idx ON public.quiz_results (username, created_at DESC);