import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local manually
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  console.error("Please add them to your .env.local file.");
  process.exit(1);
}

// Initialize Supabase client with the service role key to bypass RLS for seeding
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  const dataPath = path.resolve(process.cwd(), 'data', 'cocktails.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error(`❌ File not found: ${dataPath}`);
    console.error("Please ensure you have a data/cocktails.json file relative to the project root.");
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  let cocktails;
  
  try {
    cocktails = JSON.parse(rawData);
  } catch (err) {
    console.error("❌ Error parsing cocktails.json:", err);
    process.exit(1);
  }

  if (!Array.isArray(cocktails)) {
    console.error("❌ data/cocktails.json must contain an array of cocktail objects.");
    process.exit(1);
  }

  console.log(`Found ${cocktails.length} cocktails to seed.`);

  let successCount = 0;
  let failureCount = 0;

  for (const cocktail of cocktails) {
    // We use upsert with onConflict: 'slug' so this script can be safely re-run
    // to update existing records without creating duplicates.
    const { error } = await supabase
      .from('cocktails')
      .upsert(cocktail, { onConflict: 'slug' });

    if (error) {
      console.error(`❌ Failed to upsert cocktail "${cocktail.slug}":`, error.message);
      failureCount++;
    } else {
      console.log(`✅ Upserted cocktail: ${cocktail.name || cocktail.slug}`);
      successCount++;
    }
  }

  console.log(`\n=== Seed Completed ===`);
  console.log(`Total items: ${cocktails.length}`);
  console.log(`✅ Success:  ${successCount}`);
  if (failureCount > 0) {
    console.log(`❌ Failed:   ${failureCount}`);
  }
}

seed().catch((err) => {
  console.error("❌ Unexpected error during seeding:", err);
  process.exit(1);
});
