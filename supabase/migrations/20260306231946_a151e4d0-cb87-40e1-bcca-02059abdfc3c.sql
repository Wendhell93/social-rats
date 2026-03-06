
ALTER TABLE public.posts ADD COLUMN content_type text DEFAULT NULL;

CREATE TABLE public.content_type_multipliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technical numeric NOT NULL DEFAULT 1.0,
  meme numeric NOT NULL DEFAULT 1.0,
  announcement numeric NOT NULL DEFAULT 1.0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_type_multipliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read multipliers" ON public.content_type_multipliers FOR SELECT USING (true);
CREATE POLICY "Public update multipliers" ON public.content_type_multipliers FOR UPDATE USING (true);
