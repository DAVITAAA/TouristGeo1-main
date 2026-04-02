import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

const supabase = createClient<any>(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Successfully fetched profiles:', data.length);
    console.log('Data:', data);
  }
  
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError);
  } else {
    console.log('Successfully fetched auth users:', authUsers.users.length);
    authUsers.users.forEach((u: any) => console.log(`- ${u.email} (${u.id})`));
  }
}

console.log('Starting Supabase check script...');
await check();
console.log('Supabase check script finished.');
