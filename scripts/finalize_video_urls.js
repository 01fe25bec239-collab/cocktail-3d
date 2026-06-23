/**
 * finalize_video_urls.js
 * 
 * Updates cocktails.json with video URLs for ALL 20 cocktails
 * and regenerates the SQL update file.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VIDEOS_DST = path.join(ROOT, 'public', 'assets', 'videos');
const jsonPath = path.join(ROOT, 'data', 'cocktails.json');

const cocktails = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const sqlStatements = [];

for (const cocktail of cocktails) {
  const videoFile = `${cocktail.slug}.mp4`;
  const videoPath = path.join(VIDEOS_DST, videoFile);
  
  if (fs.existsSync(videoPath)) {
    cocktail.backdrop_video_url = `/assets/videos/${videoFile}`;
    sqlStatements.push(
      `UPDATE public.cocktails SET backdrop_video_url = '/assets/videos/${videoFile}' WHERE slug = '${cocktail.slug}';`
    );
    console.log(`✅ ${cocktail.name} → /assets/videos/${videoFile}`);
  } else {
    console.log(`⚠️  No video for: ${cocktail.name} (${cocktail.slug})`);
  }
}

// Write updated JSON
fs.writeFileSync(jsonPath, JSON.stringify(cocktails, null, 2) + '\n');
console.log(`\n📝 Updated data/cocktails.json (${cocktails.length} cocktails)`);

// Write SQL
const sqlContent = `-- Auto-generated: maps video files to cocktail records
-- Run this in Supabase SQL Editor

${sqlStatements.join('\n')}
`;

const sqlPath = path.join(ROOT, 'update_media_urls.sql');
fs.writeFileSync(sqlPath, sqlContent);
console.log(`📝 Generated update_media_urls.sql (${sqlStatements.length} statements)`);
