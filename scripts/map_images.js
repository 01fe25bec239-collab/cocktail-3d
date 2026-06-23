/**
 * map_images.js
 * 
 * Copies renamed cocktail images from cocktail_images/ into public/assets/images/
 * with slug-based filenames, updates cocktails.json, and generates SQL.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_SRC = path.join(ROOT, 'cocktail_images');
const IMAGES_DST = path.join(ROOT, 'public', 'assets', 'images');
const jsonPath = path.join(ROOT, 'data', 'cocktails.json');

fs.mkdirSync(IMAGES_DST, { recursive: true });

const cocktails = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Build a lookup: lowercase cocktail name → cocktail object
const nameToSlug = {};
for (const c of cocktails) {
  nameToSlug[c.name.toLowerCase()] = c.slug;
}

const sqlStatements = [];
let matched = 0;

const imageFiles = fs.readdirSync(IMAGES_SRC).filter(f => f.endsWith('.png'));

for (const file of imageFiles) {
  // Skip the rocks-glass utility image
  if (file.startsWith('rocks-glass')) {
    const dst = path.join(IMAGES_DST, 'rocks-glass.png');
    fs.copyFileSync(path.join(IMAGES_SRC, file), dst);
    console.log(`✅ ${file} → rocks-glass.png (utility image)`);
    continue;
  }

  // Extract cocktail name from filename (remove .png)
  const cocktailName = file.replace(/\.png$/i, '').trim();
  const slug = nameToSlug[cocktailName.toLowerCase()];

  if (!slug) {
    console.log(`⚠️  No match for image: "${file}" (tried name: "${cocktailName}")`);
    continue;
  }

  const cleanName = `${slug}.png`;
  const src = path.join(IMAGES_SRC, file);
  const dst = path.join(IMAGES_DST, cleanName);

  fs.copyFileSync(src, dst);
  const sizeMB = (fs.statSync(dst).size / (1024 * 1024)).toFixed(1);
  console.log(`✅ ${cocktailName} → ${cleanName} (${sizeMB} MB)`);

  // Update cocktails.json
  const cocktail = cocktails.find(c => c.slug === slug);
  if (cocktail) {
    cocktail.backdrop_image_url = `/assets/images/${cleanName}`;
  }

  sqlStatements.push(
    `UPDATE public.cocktails SET backdrop_image_url = '/assets/images/${cleanName}' WHERE slug = '${slug}';`
  );
  matched++;
}

// Write updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(cocktails, null, 2) + '\n');
console.log(`\n📝 Updated data/cocktails.json (${matched} images mapped)`);

// Append image SQL to the existing update_media_urls.sql
const sqlPath = path.join(ROOT, 'update_media_urls.sql');
let existingSql = fs.readFileSync(sqlPath, 'utf8');
existingSql += `\n-- Image URL updates\n${sqlStatements.join('\n')}\n`;
fs.writeFileSync(sqlPath, existingSql);
console.log(`📝 Appended ${sqlStatements.length} image UPDATE statements to update_media_urls.sql`);
