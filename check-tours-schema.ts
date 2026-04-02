import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkToursSchema() {
  console.log('Checking tours table schema...');
  const { data, error } = await supabase.from('tours').select('*').limit(1);
  if (error) {
    console.error('Failed to query tours table:', error.message);
  } else {
    console.log('Tours table works!');
    if (data && data.length > 0) {
      console.log('Sample columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty, but it exists.');
    }
  }
}

checkToursSchema();
