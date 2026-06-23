export interface CocktailIngredient {
  id?: string;
  name: string;
  amount: string;
}

export type ParticleEffect = 'rain' | 'fire' | 'neon' | 'snow' | 'bokeh' | 'none';

export interface Cocktail {
  id: string;
  slug: string;
  name: string;
  order_index: number;
  is_published: boolean;
  vibe_title: string;
  description: string;
  ingredients: CocktailIngredient[];
  taste_notes: string;
  glass_type: string;
  abv: number | null;
  theme_color_primary: string;
  theme_color_secondary: string;
  liquid_color: string;
  backdrop_video_url: string | null;
  backdrop_image_url: string | null;
  particle_effect: ParticleEffect;
  spline_scene_url?: string | null;
  created_at?: string;
  updated_at?: string;
}
