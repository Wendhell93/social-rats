
-- Create awards table
CREATE TABLE public.awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create award_prizes table
CREATE TABLE public.award_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id uuid NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
  placement integer NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  winner_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_prizes ENABLE ROW LEVEL SECURITY;

-- RLS policies for awards
CREATE POLICY "Public read awards" ON public.awards FOR SELECT USING (true);
CREATE POLICY "Public insert awards" ON public.awards FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update awards" ON public.awards FOR UPDATE USING (true);
CREATE POLICY "Public delete awards" ON public.awards FOR DELETE USING (true);

-- RLS policies for award_prizes
CREATE POLICY "Public read award_prizes" ON public.award_prizes FOR SELECT USING (true);
CREATE POLICY "Public insert award_prizes" ON public.award_prizes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update award_prizes" ON public.award_prizes FOR UPDATE USING (true);
CREATE POLICY "Public delete award_prizes" ON public.award_prizes FOR DELETE USING (true);

-- Storage bucket for award images
INSERT INTO storage.buckets (id, name, public) VALUES ('award-images', 'award-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Award images public read" ON storage.objects FOR SELECT USING (bucket_id = 'award-images');
CREATE POLICY "Award images public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'award-images');
CREATE POLICY "Award images public update" ON storage.objects FOR UPDATE USING (bucket_id = 'award-images');
CREATE POLICY "Award images public delete" ON storage.objects FOR DELETE USING (bucket_id = 'award-images');
