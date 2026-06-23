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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runDetailedTest() {
  const targetSlug = 'mojito-tropical-escape';
  
  console.log("==================================================");
  console.log("Detailed RLS Verification Test for Anon User");
  console.log("==================================================");
  
  // 1. Fetch the row BEFORE the update to confirm it exists and show its current state
  console.log("\n[STEP 1] Fetching row state BEFORE any write attempts...");
  const { data: beforeRow, error: fetchBeforeError } = await supabase
    .from('cocktails')
    .select('id, name, slug, is_published')
    .eq('slug', targetSlug)
    .single();
    
  if (fetchBeforeError || !beforeRow) {
    console.error("❌ Failed to fetch test row. Ensure it exists in the DB first:", fetchBeforeError?.message);
    process.exit(1);
  }
  console.log("Row state BEFORE update:", beforeRow);

  // 2. Attempt UPDATE using anon client
  console.log("\n[STEP 2] Attempting UPDATE of name via Anon Client...");
  const updateResult = await supabase
    .from('cocktails')
    .update({ name: 'HACKED MOJITO NAME' })
    .eq('slug', targetSlug);

  console.log(`UPDATE Response Status: ${updateResult.status} ${updateResult.statusText}`);
  console.log(`UPDATE Error Payload:`, updateResult.error);

  // 3. Fetch the row AFTER update to check if name changed
  console.log("\n[STEP 3] Fetching row state AFTER update attempt...");
  const { data: afterUpdateRow, error: fetchAfterUpdateError } = await supabase
    .from('cocktails')
    .select('id, name, slug, is_published')
    .eq('slug', targetSlug)
    .single();

  if (fetchAfterUpdateError || !afterUpdateRow) {
    console.error("❌ Failed to fetch row after update:", fetchAfterUpdateError?.message);
    process.exit(1);
  }
  console.log("Row state AFTER update:", afterUpdateRow);
  
  if (afterUpdateRow.name === beforeRow.name) {
    console.log("✅ Row update BLOCKED: The name field was NOT changed.");
  } else {
    console.log("❌ RLS VULNERABILITY DETECTED: Row name was updated!");
  }

  // 4. Attempt DELETE using anon client
  console.log("\n[STEP 4] Attempting DELETE of row via Anon Client...");
  const deleteResult = await supabase
    .from('cocktails')
    .delete()
    .eq('id', beforeRow.id);

  console.log(`DELETE Response Status: ${deleteResult.status} ${deleteResult.statusText}`);
  console.log(`DELETE Error Payload:`, deleteResult.error);

  // 5. Fetch the row AFTER delete to check if it still exists
  console.log("\n[STEP 5] Checking if row still exists AFTER delete attempt...");
  const { data: afterDeleteRow, error: fetchAfterDeleteError } = await supabase
    .from('cocktails')
    .select('id, name, slug, is_published')
    .eq('slug', targetSlug)
    .single();

  if (fetchAfterDeleteError) {
    console.log("Row not found (or fetch error):", fetchAfterDeleteError.message);
  } else {
    console.log("Row state AFTER delete:", afterDeleteRow);
  }

  if (afterDeleteRow) {
    console.log("✅ Row delete BLOCKED: The row still exists in the database.");
  } else {
    console.log("❌ RLS VULNERABILITY DETECTED: Row was deleted!");
  }
}

runDetailedTest().catch(console.error);
