import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const email = 'vili63@gmail.com';
  const { data: user } = await supabase.from('profiles').select('*').eq('email', email).single();
  console.log('User:', user?.id, user?.phone);

  const otp = '1234';
  const { error } = await supabase.from('temp_registrations').upsert({
    phone: user?.phone || 'no_phone',
    email: email,
    password: '__guest_reset__',
    otp_code: otp,
    role: 'password_reset_guest',
    expires_at: new Date(Date.now() + 10 * 60000).toISOString()
  }, { onConflict: 'phone' });
  
  if (error) {
    console.error('Upsert Error:', error.message);
  } else {
    console.log('Upsert successful');
  }
}
test();
