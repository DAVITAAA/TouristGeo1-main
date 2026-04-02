import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';
import { supabase } from '../_lib/supabase';
import { createToken } from '../_lib/auth';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required' });
  }

  try {
    // 1. Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { email, name, picture } = payload;

    // 2. Check if user already exists in profiles
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Existing user → return user + token
      const userData = {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        avatar_url: existingUser.avatar_url,
      };
      return res.json({ user: userData, token: createToken(userData) });
    }

    // 3. New user → create in Supabase Auth (no password) + profile
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: name || email.split('@')[0] },
    });

    if (authError) {
      console.error('Google auth - Supabase createUser error:', authError.message);
      return res.status(500).json({ error: 'Failed to create account' });
    }

    // 4. Create profile row
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        [{
          id: authData.user.id,
          name: name || email.split('@')[0],
          email,
          role: 'tourist',
          avatar_url: picture || null,
        }],
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileError) {
      console.error('Google auth - profile creation error:', profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create profile' });
    }

    const userData = {
      id: profileData.id,
      name: profileData.name,
      email: profileData.email,
      role: profileData.role,
      avatar_url: profileData.avatar_url,
    };
    return res.json({ user: userData, token: createToken(userData) });
  } catch (error: any) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: 'Google authentication failed' });
  }
}
