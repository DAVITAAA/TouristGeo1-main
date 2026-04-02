import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function updateRole() {
  const email = 'datonaxucrishvili62@gmail.com'; // From user's screenshot
  console.log(`Updating role for ${email}...`);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'operator' })
    .eq('email', email)
    .select();

  if (error) {
    console.error('Update failed:', error.message);
  } else {
    console.log('Update successful!', data);
  }
}

updateRole();
