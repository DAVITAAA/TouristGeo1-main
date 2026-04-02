import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data, error } = await supabase
      .from('tours')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;

    const categories = Array.from(new Set((data || []).map((c: any) => c.category)));
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
}
