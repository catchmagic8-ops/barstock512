-- Create reservations table for Polskie Smaki
CREATE TABLE public.reservations_polskie_smaki (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Essential
  guest_name text NOT NULL,
  reservation_date date NOT NULL,
  arrival_time time NOT NULL,
  number_of_guests integer NOT NULL DEFAULT 1,
  number_of_children integer,
  table_number text,
  occasion text,
  seating_request text,
  -- Food & Beverage
  dietary_requirements text[] NOT NULL DEFAULT '{}',
  allergies text,
  beverage_preference text,
  pre_ordered_items text,
  menu_preference text,
  -- Guest Info
  vip_returning boolean NOT NULL DEFAULT false,
  hotel_guest boolean NOT NULL DEFAULT false,
  room_number text,
  language text,
  mobility_needs text[] NOT NULL DEFAULT '{}',
  decoration_requests text,
  -- Operational
  reservation_source text,
  deposit_paid boolean NOT NULL DEFAULT false,
  deposit_amount numeric,
  contact_phone text,
  notes text,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS (matches other Polskie Smaki tables: open access for app users)
ALTER TABLE public.reservations_polskie_smaki ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reservations_p"
  ON public.reservations_polskie_smaki FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reservations_p"
  ON public.reservations_polskie_smaki FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reservations_p"
  ON public.reservations_polskie_smaki FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete reservations_p"
  ON public.reservations_polskie_smaki FOR DELETE USING (true);

-- Updated_at trigger
CREATE TRIGGER update_reservations_polskie_smaki_updated_at
  BEFORE UPDATE ON public.reservations_polskie_smaki
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_reservations_p_date ON public.reservations_polskie_smaki(reservation_date, arrival_time);