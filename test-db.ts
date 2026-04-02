import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testSchema() {
  console.log('Testing Profiles Table...');
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Select * failed:', error.message);
    console.log('Checking available columns...');
    const { data: cols, error: colErr } = await supabase.from('profiles').select('id, name, email').limit(1);
    if (colErr) {
      console.error('Basic query also failed:', colErr.message);
    } else {
      console.log('Basic columns work. "role" is likely missing.');
    }
  } else {
    console.log('Select * works!');
    console.log('Data sample:', data);
  }
}

testSchema();
