import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase URL or public Anon Key configuration.");
  process.exit(1);
}

// Initialize Supabase client with the public anon key (representing an unauthenticated/anonymous visitor)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runTest() {
  console.log("Testing Supabase RLS Policies for Anon/Public user...");
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Anon Key Prefix: ${SUPABASE_ANON_KEY.substring(0, 10)}...`);

  console.log("\n==========================================");
  console.log("1. Attempting unauthorized INSERT...");
  console.log("==========================================");
  const insertPayload = {
    name: 'Unauthorized Test Cocktail',
    slug: 'unauthorized-test-cocktail',
    vibe_title: 'Unauthenticated Vibe',
    description: 'This insert should be rejected by the RLS policy.',
    taste_notes: 'Spicy hack',
    glass_type: 'Highball',
    abv: 12.5,
    theme_color_primary: '#ff0000',
    theme_color_secondary: '#00ff00',
    liquid_color: '#0000ff',
    is_published: true,
    ingredients: [{ name: 'Water', amount: '100ml' }],
    order_index: 99
  };

  const insertResult = await supabase
    .from('cocktails')
    .insert([insertPayload])
    .select();

  console.log(`HTTP Status Code: ${insertResult.status}`);
  console.log(`Status Text: ${insertResult.statusText}`);
  console.log(`Data Returned:`, insertResult.data);
  console.log(`Error Response:`, JSON.stringify(insertResult.error, null, 2));

  console.log("\n==========================================");
  console.log("2. Attempting unauthorized UPDATE...");
  console.log("==========================================");
  // Attempt to update the 'mojito-tropical-escape' cocktail (which is published)
  const updateResult = await supabase
    .from('cocktails')
    .update({ name: 'Hacked Mojito Name' })
    .eq('slug', 'mojito-tropical-escape')
    .select();

  console.log(`HTTP Status Code: ${updateResult.status}`);
  console.log(`Status Text: ${updateResult.statusText}`);
  console.log(`Data Returned:`, updateResult.data);
  console.log(`Error Response:`, JSON.stringify(updateResult.error, null, 2));

  console.log("\n==========================================");
  console.log("3. Attempting unauthorized DELETE...");
  console.log("==========================================");
  // Attempt to delete the 'mojito-tropical-escape' cocktail
  const deleteResult = await supabase
    .from('cocktails')
    .delete()
    .eq('slug', 'mojito-tropical-escape')
    .select();

  console.log(`HTTP Status Code: ${deleteResult.status}`);
  console.log(`Status Text: ${deleteResult.statusText}`);
  console.log(`Data Returned:`, deleteResult.data);
  console.log(`Error Response:`, JSON.stringify(deleteResult.error, null, 2));
}

runTest().catch(console.error);
