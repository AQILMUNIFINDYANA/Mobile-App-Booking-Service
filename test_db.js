const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read url and key from env file or just use hardcoded if we can't find it
const envContent = fs.readFileSync('.env', 'utf-8');
const urlMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.log('No env found');
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  const { data, error } = await supabase.from('bookings').select('id, status, order_number, notes, created_at, users(name)');
  console.log(JSON.stringify(data, null, 2));
}

run();
