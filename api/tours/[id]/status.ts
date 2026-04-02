import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../_lib/supabase';
import { getPayloadFromRequest } from '../../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const payload = getPayloadFromRequest(req.headers.authorization);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Tour ID is required' });

  const { status } = req.body;
  if (!status || !['published', 'paused'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const { data, error } = await supabase
      .from('tours')
      .update({ status })
      .eq('id', id)
      .eq('operator_id', payload.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Tour not found or unauthorized' });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating tour status:', error);
    return res.status(500).json({ error: 'Failed to update tour status' });
  }
}
