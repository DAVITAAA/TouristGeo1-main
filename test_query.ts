import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function test() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  console.log('Thirty days ago:', thirtyDaysAgo);
  
  const { data, error } = await supabase
    .from('tours')
    .select('*, profiles(name, company_name)')
    .eq('status', 'published')
    .gte('created_at', thirtyDaysAgo)
    .order('id', { ascending: false });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Returned tours count:', data.length);
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

test();
