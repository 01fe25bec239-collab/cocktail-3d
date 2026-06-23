const fs = require('fs');

const cocktails = JSON.parse(fs.readFileSync('data/cocktails.json', 'utf8'));

let sql = `INSERT INTO public.cocktails (
    slug, name, order_index, is_published, vibe_title, description, 
    ingredients, taste_notes, glass_type, abv, theme_color_primary, 
    theme_color_secondary, liquid_color, backdrop_video_url, 
    backdrop_image_url, spline_scene_url, particle_effect
) VALUES \n`;

const escapeString = (str) => {
    if (str === null || str === undefined) return 'NULL';
    return "'" + str.replace(/'/g, "''") + "'";
};

const escapeJson = (obj) => {
    return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
};

const values = cocktails.map((c, i) => `(
    ${escapeString(c.slug)},
    ${escapeString(c.name)},
    ${c.order_index !== undefined && c.order_index !== null ? c.order_index : i},
    ${c.is_published !== undefined && c.is_published !== null ? c.is_published : true},
    ${escapeString(c.vibe_title)},
    ${escapeString(c.description)},
    ${escapeJson(c.ingredients)},
    ${escapeString(c.taste_notes)},
    ${escapeString(c.glass_type)},
    ${c.abv === null || c.abv === undefined ? 'NULL' : c.abv},
    ${escapeString(c.theme_color_primary)},
    ${escapeString(c.theme_color_secondary)},
    ${escapeString(c.liquid_color)},
    ${escapeString(c.backdrop_video_url)},
    ${escapeString(c.backdrop_image_url)},
    ${escapeString(c.spline_scene_url)},
    ${escapeString(c.particle_effect)}
)`);

sql += values.join(',\n') + '\nON CONFLICT (slug) DO UPDATE SET\n' +
    'name = EXCLUDED.name,\n' +
    'order_index = EXCLUDED.order_index,\n' +
    'is_published = EXCLUDED.is_published,\n' +
    'vibe_title = EXCLUDED.vibe_title,\n' +
    'description = EXCLUDED.description,\n' +
    'ingredients = EXCLUDED.ingredients,\n' +
    'taste_notes = EXCLUDED.taste_notes,\n' +
    'glass_type = EXCLUDED.glass_type,\n' +
    'abv = EXCLUDED.abv,\n' +
    'theme_color_primary = EXCLUDED.theme_color_primary,\n' +
    'theme_color_secondary = EXCLUDED.theme_color_secondary,\n' +
    'liquid_color = EXCLUDED.liquid_color,\n' +
    'backdrop_video_url = EXCLUDED.backdrop_video_url,\n' +
    'backdrop_image_url = EXCLUDED.backdrop_image_url,\n' +
    'spline_scene_url = EXCLUDED.spline_scene_url,\n' +
    'particle_effect = EXCLUDED.particle_effect;';

fs.writeFileSync('seed_cocktails.sql', sql);
console.log('SQL generated successfully.');
