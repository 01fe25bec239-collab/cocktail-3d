import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase configuration.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const dataPath = path.resolve(process.cwd(), 'data', 'cocktails.json');
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ cocktails.json not found: ${dataPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const cocktails = JSON.parse(rawData);

  // Parse command line arguments
  const args = process.argv.slice(2);
  const slugIndex = args.indexOf('--slug');
  const targetSlug = slugIndex !== -1 ? args[slugIndex + 1] : null;

  let cocktailsToUpdate = cocktails;
  if (targetSlug) {
    cocktailsToUpdate = cocktails.filter((c: any) => c.slug === targetSlug);
    if (cocktailsToUpdate.length === 0) {
      console.error(`❌ Slug "${targetSlug}" not found in cocktails.json.`);
      process.exit(1);
    }
    console.log(`Running scoped update for single cocktail slug: "${targetSlug}"`);
  } else {
    console.log(`Running update for all ${cocktails.length} cocktails.`);
  }

  let successCount = 0;
  let failureCount = 0;

  for (const cocktail of cocktailsToUpdate) {
    // Determine the webp backdrop path from cocktails.json (which we will update to webp)
    const backdropPath = cocktail.backdrop_image_url.replace('.png', '.webp');

    console.log(`Updating backdrop_image_url for "${cocktail.slug}" to "${backdropPath}"...`);

    const { data, error } = await supabase
      .from('cocktails')
      .update({ backdrop_image_url: backdropPath })
      .eq('slug', cocktail.slug)
      .select('name, slug, backdrop_image_url');

    if (error) {
      console.error(`❌ Failed to update backdrop_image_url for "${cocktail.slug}":`, error.message);
      failureCount++;
    } else {
      console.log(`✅ Successfully updated "${cocktail.slug}":`, data[0]);
      successCount++;
    }
  }

  console.log(`\n=== Update Completed ===`);
  console.log(`Success: ${successCount}`);
  if (failureCount > 0) {
    console.log(`Failed:  ${failureCount}`);
  }
}

run().catch(err => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
