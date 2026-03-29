-- =============================================================
-- RAFFLE SYSTEM: Areas + Sorteios + Vouchers
-- =============================================================

-- ── AREAS (pré-requisito — já referenciado no código) ────────
CREATE TABLE IF NOT EXISTS public.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas_select" ON public.areas FOR SELECT USING (true);
CREATE POLICY "areas_insert" ON public.areas FOR INSERT WITH CHECK (true);
CREATE POLICY "areas_update" ON public.areas FOR UPDATE USING (true);
CREATE POLICY "areas_delete" ON public.areas FOR DELETE USING (true);

-- ── CREATOR_AREAS (many-to-many: members ↔ areas) ───────────
CREATE TABLE IF NOT EXISTS public.creator_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  UNIQUE(creator_id, area_id)
);
ALTER TABLE public.creator_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_areas_select" ON public.creator_areas FOR SELECT USING (true);
CREATE POLICY "creator_areas_insert" ON public.creator_areas FOR INSERT WITH CHECK (true);
CREATE POLICY "creator_areas_update" ON public.creator_areas FOR UPDATE USING (true);
CREATE POLICY "creator_areas_delete" ON public.creator_areas FOR DELETE USING (true);

-- ── RAFFLES (definição do sorteio) ───────────────────────────
CREATE TABLE public.raffles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  max_vouchers_per_creator integer NOT NULL DEFAULT 999,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT raffle_valid_dates CHECK (end_date > start_date)
);
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raffles_select" ON public.raffles FOR SELECT USING (true);
CREATE POLICY "raffles_insert" ON public.raffles FOR INSERT WITH CHECK (true);
CREATE POLICY "raffles_update" ON public.raffles FOR UPDATE USING (true);
CREATE POLICY "raffles_delete" ON public.raffles FOR DELETE USING (true);

-- ── RAFFLE_AREAS (many-to-many: raffles ↔ areas) ────────────
CREATE TABLE public.raffle_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  UNIQUE(raffle_id, area_id)
);
ALTER TABLE public.raffle_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raffle_areas_select" ON public.raffle_areas FOR SELECT USING (true);
CREATE POLICY "raffle_areas_insert" ON public.raffle_areas FOR INSERT WITH CHECK (true);
CREATE POLICY "raffle_areas_delete" ON public.raffle_areas FOR DELETE USING (true);

-- ── RAFFLE_PRIZES (prêmios de cada sorteio) ─────────────────
CREATE TABLE public.raffle_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.raffle_prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raffle_prizes_select" ON public.raffle_prizes FOR SELECT USING (true);
CREATE POLICY "raffle_prizes_insert" ON public.raffle_prizes FOR INSERT WITH CHECK (true);
CREATE POLICY "raffle_prizes_update" ON public.raffle_prizes FOR UPDATE USING (true);
CREATE POLICY "raffle_prizes_delete" ON public.raffle_prizes FOR DELETE USING (true);

-- ── RAFFLE_VOUCHERS (1 voucher por post × criador × sorteio) ─
CREATE TABLE public.raffle_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(raffle_id, creator_id, post_id)
);
ALTER TABLE public.raffle_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raffle_vouchers_select" ON public.raffle_vouchers FOR SELECT USING (true);
CREATE POLICY "raffle_vouchers_insert" ON public.raffle_vouchers FOR INSERT WITH CHECK (true);
CREATE POLICY "raffle_vouchers_delete" ON public.raffle_vouchers FOR DELETE USING (true);

-- ── RAFFLE_WINNERS (ganhadores sorteados) ────────────────────
CREATE TABLE public.raffle_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  voucher_id uuid NOT NULL REFERENCES public.raffle_vouchers(id) ON DELETE CASCADE,
  prize_id uuid REFERENCES public.raffle_prizes(id) ON DELETE SET NULL,
  drawn_at timestamptz NOT NULL DEFAULT now(),
  position integer NOT NULL DEFAULT 1
);
ALTER TABLE public.raffle_winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raffle_winners_select" ON public.raffle_winners FOR SELECT USING (true);
CREATE POLICY "raffle_winners_insert" ON public.raffle_winners FOR INSERT WITH CHECK (true);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX idx_raffle_vouchers_raffle ON public.raffle_vouchers(raffle_id);
CREATE INDEX idx_raffle_vouchers_creator ON public.raffle_vouchers(creator_id);
CREATE INDEX idx_raffle_vouchers_post ON public.raffle_vouchers(post_id);
CREATE INDEX idx_raffle_areas_raffle ON public.raffle_areas(raffle_id);
CREATE INDEX idx_raffle_winners_raffle ON public.raffle_winners(raffle_id);
CREATE INDEX idx_creator_areas_creator ON public.creator_areas(creator_id);
CREATE INDEX idx_creator_areas_area ON public.creator_areas(area_id);
