// Columns needed by the public menu (cards) and the recommendation cards.
// Selecting only these keeps the SSR/ISR payload small — `select *` would also
// ship taste_notes, spline_scene_url, theme_color_secondary, liquid_color,
// particle_effect and timestamps for every row into the RSC flight data.
export const MENU_COLUMNS = [
  'id',
  'slug',
  'name',
  'order_index',
  'vibe_title',
  'description',
  'ingredients',
  'glass_type',
  'abv',
  'theme_color_primary',
  'backdrop_image_url',
  'backdrop_video_url',
  'spline_scene_url',
].join(',');
