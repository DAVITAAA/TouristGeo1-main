import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { getPayloadFromRequest } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const payload = getPayloadFromRequest(req.headers.authorization);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, name, email, company_name, phone, avatar_url, role')
      .eq('id', payload.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  }

  if (req.method === 'PUT') {
    const { name, company_name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name, company_name, phone })
        .eq('id', payload.id);

      if (error) throw error;
      return res.json({ success: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
