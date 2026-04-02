import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { createToken } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password, phone, company_name, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      console.error('--- REGISTRATION AUTH ERROR ---');
      console.error('Email:', email);
      console.error('Error Message:', authError.message);
      return res.status(400).json({ error: authError.message });
    }

    // 2. Create profile in public.profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        [{ id: authData.user.id, name, email, phone, company_name, role: role || 'tourist' }],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: profileError.message });
    }

    const user = { id: profileData.id, name: profileData.name, email: profileData.email, role: profileData.role };
    return res.json({ user, token: createToken(user) });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}
