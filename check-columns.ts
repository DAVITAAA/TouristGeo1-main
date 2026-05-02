import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function checkColumns() {
  const { data, error } = await supabase.from('tours').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  const columns = Object.keys(data[0] || {});
  console.log('Columns in tours table:', columns);
  
  const required = ['full_price', 'gallery', 'phone'];
  required.forEach(col => {
    if (columns.includes(col)) {
      console.log(`[OK] Column ${col} exists.`);
    } else {
      console.log(`[MISSING] Column ${col} is MISSING!`);
    }
  });
}

checkColumns();
