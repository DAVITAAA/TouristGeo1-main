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
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, tours(title, image)')
      .eq('user_id', payload.email)
      .order('id', { ascending: false });

    if (error) throw error;

    const formattedBookings = (bookings || []).map((b: any) => ({
      ...b,
      tour_title: b.tours?.title,
      tour_image: b.tours?.image,
    }));

    return res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}
