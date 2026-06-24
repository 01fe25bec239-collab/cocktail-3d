import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase URL or SERVICE_ROLE_KEY configuration.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runRollback() {
  const args = process.argv.slice(2);
  const slugIndex = args.indexOf('--slug');
  const targetSlug = slugIndex !== -1 ? args[slugIndex + 1] : null;

  console.log("==========================================");
  console.log("Database Rollback: .webp ➔ .png");
  console.log("==========================================");

  // Fetch cocktails from database
  let query = supabase.from('cocktails').select('id, name, slug, backdrop_image_url');
  if (targetSlug) {
    console.log(`Running scoped rollback for single slug: "${targetSlug}"`);
    query = query.eq('slug', targetSlug);
  } else {
    console.log("Running rollback for ALL cocktails in the database.");
  }

  const { data: cocktails, error: fetchError } = await query;
  if (fetchError || !cocktails) {
    console.error("❌ Failed to fetch cocktails:", fetchError?.message);
    process.exit(1);
  }

  let successCount = 0;
  let skippedCount = 0;
  let failureCount = 0;

  for (const cocktail of cocktails) {
    const currentPath = cocktail.backdrop_image_url || '';
    if (!currentPath.endsWith('.webp')) {
      console.log(`ℹ️ Skipping "${cocktail.slug}" - backdrop is already not WebP: "${currentPath}"`);
      skippedCount++;
      continue;
    }

    const pngPath = currentPath.replace('.webp', '.png');
    console.log(`Reverting "${cocktail.slug}" backdrop to: "${pngPath}"...`);

    const { data: updatedData, error: updateError } = await supabase
      .from('cocktails')
      .update({ backdrop_image_url: pngPath })
      .eq('id', cocktail.id)
      .select('name, slug, backdrop_image_url');

    if (updateError || !updatedData || updatedData.length === 0) {
      console.error(`❌ Failed to revert "${cocktail.slug}":`, updateError?.message);
      failureCount++;
    } else {
      console.log(`✅ Successfully reverted "${cocktail.slug}":`, updatedData[0]);
      successCount++;
    }
  }

  console.log(`\n=== Rollback Summary ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Skipped: ${skippedCount}`);
  if (failureCount > 0) {
    console.log(`Failed:  ${failureCount}`);
  }
}

runRollback().catch(err => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
