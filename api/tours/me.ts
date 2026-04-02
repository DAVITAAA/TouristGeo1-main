import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { getPayloadFromRequest } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const payload = getPayloadFromRequest(req.headers.authorization);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: tours, error } = await supabase
      .from('tours')
      .select('*')
      .eq('operator_id', payload.id)
      .order('id', { ascending: false });

    if (error) throw error;
    return res.json(tours);
  } catch (error) {
    console.error('Error fetching my tours:', error);
    return res.status(500).json({ error: 'Failed to fetch tours' });
  }
}
