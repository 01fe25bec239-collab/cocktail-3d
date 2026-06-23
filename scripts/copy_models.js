const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'cocktail_models');
const DST_DIR = path.join(ROOT, 'public', 'assets', 'models');

const MAP = {
  // Glasses
  "Meshy_AI_Champagne_flute_tal_0621232148_texture.glb": "glasses/flute.glb",
  "Meshy_AI_Copper_mug_Moscow_m_0621232136_texture.glb": "glasses/mug.glb",
  "Meshy_AI_Coupe_glass_elegant_0621230832_texture.glb": "glasses/coupe.glb",
  "Meshy_AI_Highball_glass_tall_0621232127_texture.glb": "glasses/highball.glb",
  "Meshy_AI_Rocks_glass_short_h_0621232122_texture.glb": "glasses/rocks.glb",
  "Meshy_AI_Tiki_hurricane_glass__0621232131_texture.glb": "glasses/hurricane.glb",
  "Meshy_AI_A_graceful_classic_g_0621232143_texture.glb": "glasses/martini.glb",
  "Meshy_AI_A_pristine_classic_w_0621232139_texture.glb": "glasses/wine.glb",

  // Ice
  "Meshy_AI_Ice_Cube_0621233123_texture.glb": "ice/cube.glb",
  "Meshy_AI_Ice_Mountain_0621232023_texture.glb": "ice/mountain.glb",

  // Garnishes
  "Meshy_AI_Roasted_Coffee_Beans_0621232102_texture.glb": "garnishes/coffee_beans.glb",
  "Meshy_AI_Tropical_Hibiscus_Umb_0621232054_texture.glb": "garnishes/umbrella.glb",
  "Meshy_AI_Pineapple_wedge_0621232050_texture.glb": "garnishes/pineapple.glb",
  "Meshy_AI_Orange_Spiral_Peel_0621232047_texture.glb": "garnishes/orange_peel.glb",
  "Meshy_AI_Olive_on_a_Pin_0621232043_texture.glb": "garnishes/olive.glb",
  "Meshy_AI_Crimson_Cherry_0621232038_texture.glb": "garnishes/cherry.glb",
  "Meshy_AI_Mint_Cross_0621232035_texture.glb": "garnishes/mint.glb",
  "Meshy_AI_Lemon_Slice_0621232030_texture.glb": "garnishes/lemon_slice.glb",

  // Liquids / Blobs
  "Meshy_AI_Golden_Blob_0621231113_texture.glb": "liquids/golden_blob.glb",
  "Meshy_AI_Creamy_Bubble_Bloom_0621231037_texture.glb": "liquids/bubble_bloom.glb",
  "Meshy_AI_Crimson_Jelly_Blob_0621230823_texture.glb": "liquids/jelly_blob.glb",
  "Meshy_AI_Emerald_Gel_Blob_0621230617_texture.glb": "liquids/gel_blob.glb",
  "Meshy_AI__translucent_clear_li_0621230803_texture.glb": "liquids/translucent_clear.glb",
  "Meshy_AI__translucent_vibrant__0621231056_texture.glb": "liquids/translucent_vibrant.glb"
};

// Create directories
const subdirs = ['glasses', 'ice', 'garnishes', 'liquids'];
for (const dir of subdirs) {
  fs.mkdirSync(path.join(DST_DIR, dir), { recursive: true });
}

let copied = 0;
for (const [srcName, dstRelPath] of Object.entries(MAP)) {
  const srcPath = path.join(SRC_DIR, srcName);
  const dstPath = path.join(DST_DIR, dstRelPath);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, dstPath);
    console.log(`✅ Copied: ${srcName} -> ${dstRelPath}`);
    copied++;
  } else {
    console.warn(`⚠️ Warning: Source file does not exist: ${srcName}`);
  }
}

console.log(`\n🎉 Organized and copied ${copied} 3D assets to ${DST_DIR}`);
