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

async function backup() {
  console.log("Fetching cocktails table from production Supabase...");
  const { data, error } = await supabase
    .from('cocktails')
    .select('*')
    .order('id');

  if (error) {
    console.error("❌ Failed to fetch cocktails:", error.message);
    process.exit(1);
  }

  const backupPath = path.resolve(process.cwd(), 'data', 'cocktails_production_backup_20260624.json');
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');
  
  console.log(`✅ Backup successfully created at: ${backupPath}`);
  console.log(`Total records backed up: ${data.length}`);
}

backup().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
