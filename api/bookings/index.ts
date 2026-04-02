import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { getPayloadFromRequest } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST /api/bookings — create a booking
  if (req.method === 'POST') {
    const { tour_id, user_name, user_email, booking_date, guests, total_price } = req.body;
    if (!tour_id || !user_name || !user_email || !booking_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          { 
            tour_id, 
            user_id: user_email, 
            booking_date, 
            total_price: total_price || 0 
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return res.json({ id: data.id });
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ error: 'Booking failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
