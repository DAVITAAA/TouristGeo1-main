import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { getPayloadFromRequest } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Tour ID is required' });

  // GET /api/tours/[id] — public tour detail
  if (req.method === 'GET') {
    try {
      const { data: tour, error } = await supabase
        .from('tours')
        .select('*, profiles(name)')
        .eq('id', id)
        .single();

      if (error || !tour) return res.status(404).json({ error: 'Tour not found' });

      return res.json({
        ...tour,
        operator_name: tour.profiles?.name,
      });
    } catch (error) {
      console.error('Error fetching tour detail:', error);
      return res.status(500).json({ error: 'Failed to fetch tour' });
    }
  }

  // PUT /api/tours/[id] — update tour
  if (req.method === 'PUT') {
    const payload = getPayloadFromRequest(req.headers.authorization);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title, category, location, duration, description,
      price, maxGroupSize, itinerary, imageUrl, existingGallery,
    } = req.body;

    try {
      let updateData: any = {
        title, category, location, duration, description,
        price: price ? parseFloat(price) : null,
        max_group_size: maxGroupSize ? parseInt(maxGroupSize) : null,
      };

      if (imageUrl) {
        updateData.image = imageUrl;
      }

      let galleryData = existingGallery ? (typeof existingGallery === 'string' ? JSON.parse(existingGallery) : existingGallery) : [];
      updateData.gallery = galleryData;

      let itineraryData = itinerary ? (typeof itinerary === 'string' ? JSON.parse(itinerary) : itinerary) : [];
      updateData.itinerary = itineraryData;

      const { data, error } = await supabase
        .from('tours')
        .update(updateData)
        .eq('id', id)
        .eq('operator_id', payload.id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ id: data.id, success: true });
    } catch (error) {
      console.error('Error updating tour:', error);
      return res.status(500).json({ error: 'Failed to update tour' });
    }
  }

  // DELETE /api/tours/[id]
  if (req.method === 'DELETE') {
    const payload = getPayloadFromRequest(req.headers.authorization);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', id)
        .eq('operator_id', payload.id);

      if (error) throw error;
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting tour:', error);
      return res.status(500).json({ error: 'Failed to delete tour' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
