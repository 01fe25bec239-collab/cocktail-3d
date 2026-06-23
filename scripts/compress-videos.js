const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VIDEO_DIR = path.join(__dirname, '../public/assets/videos');
const TEMP_DIR = path.join(__dirname, '../public/assets/videos/temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

const files = fs.readdirSync(VIDEO_DIR).filter(file => file.endsWith('.mp4'));

console.log(`Found ${files.length} videos to check for compression.`);

for (const file of files) {
  const inputPath = path.join(VIDEO_DIR, file);
  const outputPath = path.join(TEMP_DIR, file);

  const { size } = fs.statSync(inputPath);
  const sizeMB = size / (1024 * 1024);

  if (sizeMB < 5) {
    console.log(`Skipping ${file} - already under 5MB (${sizeMB.toFixed(1)}MB)`);
    continue;
  }

  console.log(`Compressing ${file} (${sizeMB.toFixed(1)}MB)...`);
  
  // FFmpeg command with safe downscaling filter
  const command = `ffmpeg -i "${inputPath}" -vcodec libx264 -acodec aac -crf 28 -preset fast -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2" -y "${outputPath}"`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    
    // Check output size
    const { size: outSize } = fs.statSync(outputPath);
    const outSizeMB = outSize / (1024 * 1024);
    
    if (outSize >= size) {
      console.log(`Output is larger or same (${outSizeMB.toFixed(1)}MB). Discarding compression for ${file}.`);
      fs.unlinkSync(outputPath);
    } else {
      console.log(`Success! ${file} compressed to ${outSizeMB.toFixed(1)}MB. Replacing original.`);
      fs.renameSync(outputPath, inputPath);
    }
  } catch (err) {
    console.error(`Error compressing ${file}:`, err.message);
  }
}

// Cleanup
if (fs.existsSync(TEMP_DIR)) {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}

console.log('Video compression complete.');
