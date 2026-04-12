
ALTER TABLE public.events ADD COLUMN category TEXT DEFAULT 'general';
ALTER TABLE public.events ADD COLUMN price NUMERIC(10,2);
ALTER TABLE public.events ADD COLUMN event_time TIME;
ALTER TABLE public.events ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.events ADD COLUMN recurrence_rule TEXT;
