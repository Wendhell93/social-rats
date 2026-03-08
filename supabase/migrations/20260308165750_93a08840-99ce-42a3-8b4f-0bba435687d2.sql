
CREATE TABLE IF NOT EXISTS public.stories_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  views_pico_weight numeric NOT NULL DEFAULT 0.25,
  interactions_weight numeric NOT NULL DEFAULT 3,
  forwards_weight numeric NOT NULL DEFAULT 5,
  cta_clicks_weight numeric NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.stories_weights (views_pico_weight, interactions_weight, forwards_weight, cta_clicks_weight)
VALUES (0.25, 3, 5, 10);
