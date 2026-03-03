
-- Criar tabela junction post_creators (many-to-many)
CREATE TABLE public.post_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  UNIQUE(post_id, creator_id)
);

ALTER TABLE public.post_creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read post_creators" ON public.post_creators FOR SELECT USING (true);
CREATE POLICY "Public insert post_creators" ON public.post_creators FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete post_creators" ON public.post_creators FOR DELETE USING (true);

-- Tornar member_id nullable (para suportar posts sem criador principal obrigatório)
ALTER TABLE public.posts ALTER COLUMN member_id DROP NOT NULL;
