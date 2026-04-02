import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { createToken, getPayloadFromRequest } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/tours — list tours
  if (req.method === 'GET') {
    try {
      const { category, search } = req.query;
      let query = supabase
        .from('tours')
        .select('*, profiles(name)')
        .eq('status', 'published');

      if (category && typeof category === 'string') {
        query = query.eq('category', category);
      }
      if (search && typeof search === 'string') {
        query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
      }

      const { data: tours, error } = await query.order('id', { ascending: false });
      if (error) throw error;

      const formattedTours = (tours || []).map((t: any) => ({
        ...t,
        operator_name: t.profiles?.name,
        languages: t.languages || [],
        highlights: t.highlights || [],
        included: t.included || [],
        not_included: t.not_included || [],
        gallery: t.gallery || [],
        itinerary: t.itinerary || [],
      }));

      return res.json(formattedTours);
    } catch (error) {
      console.error('Error fetching tours:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // POST /api/tours — create tour
  if (req.method === 'POST') {
    const payload = getPayloadFromRequest(req.headers.authorization);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title, category, location, duration, description,
      price, maxGroupSize, itinerary, imageUrl, existingGallery,
    } = req.body;

    try {
      let itineraryData = itinerary ? (typeof itinerary === 'string' ? JSON.parse(itinerary) : itinerary) : [];
      let galleryData = existingGallery ? (typeof existingGallery === 'string' ? JSON.parse(existingGallery) : existingGallery) : [];

      const { data, error } = await supabase
        .from('tours')
        .insert([
          {
            operator_id: payload.id,
            title, category, location, duration, description,
            price: price ? parseFloat(price) : null,
            max_group_size: maxGroupSize ? parseInt(maxGroupSize) : null,
            image: imageUrl || 'https://storage.georgia.travel/images/nature-of-georgia.webp',
            gallery: galleryData,
            itinerary: itineraryData,
            status: 'published',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return res.json({ id: data.id, success: true });
    } catch (error) {
      console.error('Error inserting tour:', error);
      return res.status(500).json({ error: 'Failed to create tour' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
