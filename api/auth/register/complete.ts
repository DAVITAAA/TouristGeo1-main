import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../_lib/supabase';
import { createToken } from '../../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  try {
    // 1. Verify OTP
    const { data: temp, error: findError } = await supabase
      .from('temp_registrations')
      .select('*')
      .eq('email', email)
      .eq('otp_code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (findError || !temp) return res.status(400).json({ error: 'Invalid or expired verification code' });

    // 2. Create in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: temp.email,
      password: temp.password,
      email_confirm: true,
      user_metadata: { name: temp.name }
    });

    if (authError) return res.status(400).json({ error: authError.message });

    // 3. Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert([{ 
        id: authData.user.id, 
        name: temp.name, 
        email: temp.email, 
        phone: temp.phone, 
        company_name: temp.company_name, 
        role: temp.role || 'tourist' 
      }], { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create profile' });
    }

    // 4. Cleanup
    await supabase.from('temp_registrations').delete().eq('email', email);

    const user = { id: profileData.id, name: profileData.name, email: profileData.email, role: profileData.role };
    return res.json({ user, token: createToken(user) });
  } catch (error: any) {
    return res.status(500).json({ error: 'Completion failed' });
  }
}
