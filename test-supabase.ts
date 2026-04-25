import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function test() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Supabase Auth Admin Error:', error.message);
  } else {
    console.log('Successfully listed users. Count:', data.users.length);
  }
}

test();
