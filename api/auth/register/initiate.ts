import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../_lib/supabase';
import { sendOTPEmail } from '../../_lib/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, password, phone, company_name, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Check if user already exists
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    // 2. Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`[AUTH] Email OTP for ${email}: ${otp}`);

    // 3. Delete any existing temp registration for this email, then insert new one
    await supabase.from('temp_registrations').delete().eq('email', email);

    const { error: tempError } = await supabase.from('temp_registrations').insert({
      phone: phone || `reg_${Date.now()}`, email, name, password, role, company_name, otp_code: otp,
      expires_at: new Date(Date.now() + 10 * 60000).toISOString()
    });

    if (tempError) {
      console.error('Temp auth insert error:', tempError);
      return res.status(500).json({ error: 'Failed to initiate registration.' });
    }

    // 4. Send OTP email (non-blocking — registration succeeds even if email fails)
    try {
      await sendOTPEmail(email, otp, 'registration');
    } catch (emailErr: any) {
      console.error('Email send error (non-fatal):', emailErr.message);
    }

    return res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
