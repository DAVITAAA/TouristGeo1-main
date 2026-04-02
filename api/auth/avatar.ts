import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_lib/supabase';
import { getPayloadFromRequest } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = getPayloadFromRequest(req.headers.authorization);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  // Note: File uploads don't work the same on Vercel serverless.
  // For production, you should upload avatars directly to Supabase Storage from the frontend.
  return res.status(501).json({ 
    error: 'Avatar upload via server is not supported on Vercel. Please upload directly to Supabase Storage from the frontend.' 
  });
}
