
CREATE TABLE public.creation_school_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  url text NOT NULL,
  button_label text NOT NULL DEFAULT 'Acessar',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creation_school_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select creation_school_spaces" ON public.creation_school_spaces FOR SELECT USING (true);
CREATE POLICY "Public insert creation_school_spaces" ON public.creation_school_spaces FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update creation_school_spaces" ON public.creation_school_spaces FOR UPDATE USING (true);
CREATE POLICY "Public delete creation_school_spaces" ON public.creation_school_spaces FOR DELETE USING (true);
