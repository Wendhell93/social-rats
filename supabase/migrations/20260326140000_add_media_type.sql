-- Add media_type column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'static';

-- Create media_type_multipliers config table
CREATE TABLE IF NOT EXISTS media_type_multipliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  static_multiplier numeric NOT NULL DEFAULT 1.0,
  video_multiplier numeric NOT NULL DEFAULT 1.0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO media_type_multipliers (static_multiplier, video_multiplier) VALUES (1.0, 1.0);

-- Enable RLS
ALTER TABLE media_type_multipliers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read media_type_multipliers"
  ON media_type_multipliers FOR SELECT
  USING (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update media_type_multipliers"
  ON media_type_multipliers FOR UPDATE
  USING (auth.role() = 'authenticated');
