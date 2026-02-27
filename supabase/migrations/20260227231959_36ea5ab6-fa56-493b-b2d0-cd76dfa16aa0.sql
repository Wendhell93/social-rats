
-- Tabela de membros da equipe
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de posts
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  title TEXT,
  thumbnail_url TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  score NUMERIC NOT NULL DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pesos de engajamento
CREATE TABLE public.engagement_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  likes_weight NUMERIC NOT NULL DEFAULT 1,
  comments_weight NUMERIC NOT NULL DEFAULT 3,
  shares_weight NUMERIC NOT NULL DEFAULT 5,
  saves_weight NUMERIC NOT NULL DEFAULT 2,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir pesos padrão
INSERT INTO public.engagement_weights (likes_weight, comments_weight, shares_weight, saves_weight)
VALUES (1, 3, 5, 2);

-- Habilitar RLS (acesso público sem autenticação)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_weights ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sem autenticação)
CREATE POLICY "Public read members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Public insert members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update members" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Public delete members" ON public.members FOR DELETE USING (true);

CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public insert posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Public delete posts" ON public.posts FOR DELETE USING (true);

CREATE POLICY "Public read weights" ON public.engagement_weights FOR SELECT USING (true);
CREATE POLICY "Public update weights" ON public.engagement_weights FOR UPDATE USING (true);
