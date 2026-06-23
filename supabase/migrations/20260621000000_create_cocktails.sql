CREATE TYPE particle_effect AS ENUM ('rain', 'fire', 'neon', 'snow', 'bokeh', 'none');

CREATE TABLE cocktails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    vibe_title TEXT NOT NULL,
    description TEXT NOT NULL,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    taste_notes TEXT NOT NULL,
    glass_type TEXT NOT NULL,
    abv NUMERIC,
    theme_color_primary TEXT NOT NULL,
    theme_color_secondary TEXT NOT NULL,
    liquid_color TEXT NOT NULL,
    backdrop_video_url TEXT,
    backdrop_image_url TEXT,
    spline_scene_url TEXT,
    particle_effect particle_effect NOT NULL DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cocktails ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published cocktails
CREATE POLICY "Public can read published cocktails" 
ON cocktails 
FOR SELECT 
USING (is_published = true);

-- Policy: Authenticated users can insert cocktails
CREATE POLICY "Authenticated users can insert cocktails" 
ON cocktails 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy: Authenticated users can update cocktails
CREATE POLICY "Authenticated users can update cocktails" 
ON cocktails 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users can delete cocktails
CREATE POLICY "Authenticated users can delete cocktails" 
ON cocktails 
FOR DELETE 
TO authenticated 
USING (true);
