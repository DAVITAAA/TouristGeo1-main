import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { createToken } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  console.log(`--- LOGIN ATTEMPT: ${email} ---`);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('--- LOGIN ERROR ---');
      console.log('Email:', email);
      console.log('Supabase Error:', error.message);
      console.log('Supabase Status:', error.status);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Fetch profile
    const { data: user, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
    return res.json({ user: userData, token: createToken(userData) });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: `Login failed: ${error.message}` });
  }
}
