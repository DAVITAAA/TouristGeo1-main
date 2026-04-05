import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { OAuth2Client } from 'google-auth-library';
import multer from 'multer';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const RESEND_ENABLED = false; // Set to true when you have a valid Resend API key
console.log('--- SERVER CODE IS ACTIVE ---');
if (!process.env.RESEND_API_KEY) {
  console.warn('[WARN] RESEND_API_KEY is not set in .env');
} else {
  console.log('[INFO] RESEND_API_KEY is detected (sending disabled via RESEND_ENABLED flag)');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
const upload = multer({ storage: multer.memoryStorage() });
// Removed local static uploads path as files are now on Supabase

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  fs.appendFileSync('error.log', `Unhandled Error: ${err.message} - ${err.stack}\n`);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

app.get('/', (req, res) => res.send('TouristGeo API Server is running. Visit <a href="http://localhost:5173">port 5173</a> for the website.'));

// Simple Token Helper for Demo
const JWT_SECRET = 'super-secret-key-123';
const createToken = (user: any) => {
  const payload = Buffer.from(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 })).toString('base64');
  return payload; // Very simplistic "token" for local dev
};
const verifyToken = (token: string) => {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

// --- AUTH ROUTES ---

// --- AUTH ROUTES ---

app.post('/api/auth/register/initiate', async (req, res) => {
  const { name, email, password, phone, company_name, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`[AUTH] Email OTP for ${email}: ${otp}`);

    // Delete any existing temp registration for this email first
    await supabase.from('temp_registrations').delete().eq('email', email);

    if (!RESEND_ENABLED) {
      console.log(`[DEV] Resend disabled. Bypassing OTP verification for ${email} and registering directly.`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError) return res.status(400).json({ error: authError.message });

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert([{ 
          id: authData.user.id, 
          name, 
          email, 
          phone, 
          company_name, 
          role: role || 'tourist' 
        }], { onConflict: 'id' })
        .select()
        .single();

      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        return res.status(500).json({ error: 'Failed to create profile' });
      }

      await supabase.from('temp_registrations').delete().eq('email', email);

      const user = { id: profileData.id, name: profileData.name, email: profileData.email, role: profileData.role };
      return res.json({ user, token: createToken(user) });
    }

    const { error: tempError } = await supabase.from('temp_registrations').insert({
      phone: phone || `reg_${Date.now()}`, email, name, password, role, company_name, otp_code: otp,
      expires_at: new Date(Date.now() + 10 * 60000).toISOString()
    });

    if (tempError) {
      console.error('Temp reg error:', tempError);
      return res.status(500).json({ error: 'Failed to initiate registration.' });
    }

    // Send OTP email via Resend (disabled — check console for OTP)
    if (RESEND_ENABLED) {
      try {
        const { data, error: emailErr } = await resend.emails.send({
          from: 'TouristGeo <onboarding@resend.dev>',
          to: email,
          subject: 'TouristGeo - Verification Code',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;"><h1 style="color:#22c55e;text-align:center;">TouristGeo</h1><div style="text-align:center;padding:24px;background:#f0fdf4;border-radius:12px;"><p style="color:#6b7280;">Your verification code is:</p><div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#16a34a;padding:12px;">${otp}</div></div><p style="color:#9ca3af;font-size:12px;text-align:center;">This code expires in 10 minutes.</p></div>`,
        });
        if (emailErr) {
          console.error('Resend API Error (registration):', emailErr);
          return res.status(500).json({ error: `Email service error: ${emailErr.message || 'Unknown error'}. Note: If you are using the onboarding email, you can only send to your own Resend account email.` });
        }
        console.log('Email sent successfully:', data?.id);
      } catch (err: any) {
        console.error('Fatal Email send error:', err);
        return res.status(500).json({ error: 'Failed to send verification email.' });
      }
    } else {
      console.log(`[DEV] Resend disabled. OTP for ${email}: ${otp} (use this code to complete registration)`);
    }

    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error: any) {
    console.error('Initiate error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register/complete', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  try {
    const { data: temp, error: findError } = await supabase
      .from('temp_registrations')
      .select('*')
      .eq('email', email)
      .eq('otp_code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (findError || !temp) return res.status(400).json({ error: 'Invalid or expired verification code' });

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: temp.email,
      password: temp.password,
      email_confirm: true,
      user_metadata: { name: temp.name }
    });

    if (authError) return res.status(400).json({ error: authError.message });

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert([{ 
        id: authData.user.id, 
        name: temp.name, 
        email: temp.email, 
        phone: temp.phone, 
        company_name: temp.company_name, 
        role: temp.role || 'tourist' 
      }], { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create profile' });
    }

    await supabase.from('temp_registrations').delete().eq('email', email);

    const user = { id: profileData.id, name: profileData.name, email: profileData.email, role: profileData.role };
    res.json({ user, token: createToken(user) });
  } catch (error: any) {
    console.error('Complete error:', error);
    res.status(500).json({ error: 'Completion failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`--- LOGIN ATTEMPT: ${email} ---`);
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(401).json({ error: 'Invalid credentials' });

    // Fetch profile
    const { data: user, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !user) return res.status(404).json({ error: 'User profile not found' });

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ user: userData, token: createToken(userData) });
  } catch (error: any) {
    const errorMsg = error.message || (typeof error === 'string' ? error : 'Internal Server Error');
    console.error('--- LOGIN ERROR ---', errorMsg);
    if (error.code) console.error('Error Code:', error.code);
    
    fs.appendFileSync('error.log', `[${new Date().toISOString()}] Login Error: ${errorMsg} - ${error.stack || 'No stack'}\n`);
    
    res.status(500).json({ 
        error: 'Login failed due to a server error.', 
        details: errorMsg,
        code: error.code || 'UNKNOWN'
    });
  }
});

// Google Auth
app.post('/api/auth/google', async (req, res) => {
  const { credential, role } = req.body;
  if (!credential) return res.status(400).json({ error: 'Google credential is required' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid Google token' });

    const { email, name, picture } = payload;

    const { data: existingUser } = await supabase.from('profiles').select('*').eq('email', email).single();

    if (existingUser) {
      const userData = { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role, avatar_url: existingUser.avatar_url };
      return res.json({ user: userData, token: createToken(userData) });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: name || email.split('@')[0] },
    });
    if (authError) return res.status(500).json({ error: 'Failed to create account', details: authError.message });

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert([{ 
        id: authData.user.id, 
        name: name || email.split('@')[0], 
        email, 
        role: role || 'tourist', 
        avatar_url: picture || null 
      }], { onConflict: 'id' })
      .select().single();

    if (profileError) {
      console.error('--- GOOGLE PROFILE ERROR ---', profileError);
      fs.appendFileSync('error.log', `[${new Date().toISOString()}] Google Profile Error: ${JSON.stringify(profileError)}\n`);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create profile', details: profileError.message });
    }

    const userData = { id: profileData.id, name: profileData.name, email: profileData.email, role: profileData.role, avatar_url: profileData.avatar_url };
    res.json({ user: userData, token: createToken(userData) });
  } catch (error: any) {
    const errorMsg = error.message || (typeof error === 'string' ? error : 'Google Authentication failed');
    console.error('--- GOOGLE AUTH FATAL ERROR ---', errorMsg);
    fs.appendFileSync('error.log', `[${new Date().toISOString()}] Google Fatal Error: ${errorMsg} - ${error.stack || 'No stack'}\n`);
    res.status(500).json({ 
        error: 'Google authentication failed', 
        details: errorMsg,
        code: error.code || 'UNKNOWN'
    });
  }
});
app.delete('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || !payload.id) return res.status(401).json({ error: 'Invalid token' });

  try {
     const { data: user } = await supabase.from('profiles').select('email').eq('id', payload.id).single();
     if (!user) return res.status(404).json({ error: 'User not found' });

     // 1. Delete associated tours first (cascade manually)
     await supabase.from('tours').delete().eq('operator_id', payload.id);
     
     // 2. Delete profile
     await supabase.from('profiles').delete().eq('id', payload.id);
     
     // 3. Delete from Supabase Auth
     const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(payload.id);
     if (deleteAuthError) console.error('Warning: Auth delete error:', deleteAuthError);

     // 4. Send Confirmation Email (disabled when RESEND_ENABLED is false)
     if (RESEND_ENABLED) {
       try {
         await resend.emails.send({
           from: 'TouristGeo <onboarding@resend.dev>',
           to: user.email,
           subject: 'TouristGeo - Account Deleted',
           html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;">
                   <h1 style="color:#ef4444;text-align:center;">TouristGeo</h1>
                   <p>Your account and all associated data (including any created tours) have been successfully and permanently deleted.</p>
                   <p>We are sorry to see you go! If this was a mistake, or you wish to return, you can register a new account at any time.</p>
                 </div>`,
         });
       } catch (e) {
         console.error('Failed to send deletion email', e);
       }
     } else {
       console.log(`[DEV] Resend disabled. Skipped account deletion email for ${user.email}`);
     }

     res.json({ success: true });
  } catch (error: any) {
     console.error('Account delete endpoint error:', error);
     res.status(500).json({ error: 'Failed to delete account' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, name, email, company_name, phone, avatar_url, role')
    .eq('id', payload.id)
    .single();

  if (error || !user) return res.status(404).json({ error: 'User not found' });

  res.json({ user });
});

app.put('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { name, company_name, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ name, company_name, phone })
      .eq('id', payload.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/auth/avatar', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { avatar_url } = req.body;
  if (!avatar_url) return res.status(400).json({ error: 'No avatar URL provided' });

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url })
      .eq('id', payload.id);

    if (error) throw error;
    res.json({ avatar_url });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

app.post('/api/auth/password/initiate', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { newPassword } = req.body;

  try {
    const { data: user } = await supabase.from('profiles').select('*').eq('id', payload.id).single();
    if (!user || !user.email) return res.status(400).json({ error: 'User or email not found' });

    // If '__verify_only__', generate and store OTP for identity verification via email
    if (newPassword === '__verify_only__') {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      console.log(`[AUTH] Email OTP for identity verify (${user.email}): ${otp}`);
      // Send OTP email via Resend (disabled when RESEND_ENABLED is false)
      if (RESEND_ENABLED) {
        try {
          const { data, error: emailErr } = await resend.emails.send({
            from: 'TouristGeo <onboarding@resend.dev>',
            to: user.email,
            subject: 'TouristGeo - Password Change Verification',
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;"><h1 style="color:#22c55e;text-align:center;">TouristGeo</h1><div style="text-align:center;padding:24px;background:#f0fdf4;border-radius:12px;"><p style="color:#6b7280;">Your password change verification code is:</p><div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#16a34a;padding:12px;">${otp}</div></div><p style="color:#9ca3af;font-size:12px;text-align:center;">This code expires in 10 minutes.</p></div>`,
          });
          if (emailErr) {
            console.error('Resend API Error (password change verify):', emailErr);
            return res.status(500).json({ error: `Email service error: ${emailErr.message}. Note: Onboarding emails only send to the account owner.` });
          }
          console.log('Verification email sent successfully:', data?.id);
        } catch (err: any) {
          console.error('Fatal Email send error (password verify):', err);
          return res.status(500).json({ error: 'Failed to send verification email' });
        }
      } else {
        console.log(`[DEV] Resend disabled. Password change OTP for ${user.email}: ${otp}`);
      }

      // Store/Update OTP for verification
      const { error: tempError } = await supabase.from('temp_registrations').upsert({
        phone: user.phone || `verify_${user.email}`,
        email: user.email,
        password: '__verify_only__',
        otp_code: otp,
        role: 'password_reset',
        expires_at: new Date(Date.now() + 10 * 60000).toISOString()
      }, { onConflict: 'phone' });

      if (tempError) throw tempError;
      return res.json({ success: true, email: user.email });
    }

    // Otherwise, this is the actual password update (after OTP was verified)
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      payload.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    // Clean up temp record
    await supabase.from('temp_registrations').delete().eq('email', user.email).eq('role', 'password_reset');

    res.json({ success: true });
  } catch (error: any) {
    console.error('Password initiate error:', error);
    res.status(500).json({ error: error.message || 'Failed to process password change' });
  }
});

app.post('/api/auth/password/complete', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const { data: user } = await supabase.from('profiles').select('email').eq('id', payload.id).single();
    if (!user || !user.email) return res.status(400).json({ error: 'User not found' });

    const { data: temp, error: findError } = await supabase
      .from('temp_registrations')
      .select('*')
      .eq('email', user.email)
      .eq('otp_code', code)
      .eq('role', 'password_reset')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (findError || !temp) return res.status(400).json({ error: 'Invalid or expired code' });

    // OTP verified — return success (password change happens in next step)
    res.json({ success: true, verified: true });
  } catch (error: any) {
    console.error('Password complete error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// --- GUEST PASSWORD RESET ROUTES ---

app.post('/api/auth/password/forgot/initiate', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { data: user } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (!user) return res.status(404).json({ error: 'User with this email not found' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`[AUTH] Guest Email OTP for password reset (${email}): ${otp}`);
    // Send OTP email via Resend (disabled when RESEND_ENABLED is false)
    if (RESEND_ENABLED) {
      try {
        const { data, error: emailErr } = await resend.emails.send({
          from: 'TouristGeo <onboarding@resend.dev>',
          to: email,
          subject: 'TouristGeo - Password Reset Code',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;"><h1 style="color:#22c55e;text-align:center;">TouristGeo</h1><div style="text-align:center;padding:24px;background:#f0fdf4;border-radius:12px;"><p style="color:#6b7280;">Your password reset code is:</p><div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#16a34a;padding:12px;">${otp}</div></div><p style="color:#9ca3af;font-size:12px;text-align:center;">This code expires in 10 minutes.</p></div>`,
        });
        if (emailErr) {
          console.error('Resend API Error (guest password reset):', emailErr);
          return res.status(500).json({ error: `Email service error: ${emailErr.message || 'Unknown error'}. Note: If you are using the onboarding email, you can only send to your own Resend account email.` });
        }
        console.log('Reset email sent successfully:', data?.id);
      } catch (err: any) {
        console.error('Fatal Reset email send error:', err);
        return res.status(500).json({ error: 'Failed to send reset email.' });
      }
    } else {
      console.log(`[DEV] Resend disabled. Password reset OTP for ${email}: ${otp}`);
    }

    const { error: tempError } = await supabase.from('temp_registrations').upsert({
      phone: user.phone || `guest_${email}`,
      email: email,
      password: '__guest_reset__',
      otp_code: otp,
      role: 'password_reset_guest',
      expires_at: new Date(Date.now() + 10 * 60000).toISOString()
    }, { onConflict: 'phone' });

    if (tempError) throw tempError;
    res.json({ success: true, email });
  } catch (error: any) {
    console.error('Guest password reset initiate error:', error);
    res.status(500).json({ error: error.message || 'Failed to initiate password reset' });
  }
});

app.post('/api/auth/password/forgot/verify', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  try {
    const { data: temp, error: findError } = await supabase
      .from('temp_registrations')
      .select('*')
      .eq('email', email)
      .eq('otp_code', code)
      .eq('role', 'password_reset_guest')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (findError || !temp) return res.status(400).json({ error: 'Invalid or expired code' });

    res.json({ success: true, verified: true });
  } catch (error: any) {
    console.error('Guest password verify error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

app.post('/api/auth/password/forgot/complete', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Email, code, and new password are required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const { data: user } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { data: temp, error: findError } = await supabase
      .from('temp_registrations')
      .select('*')
      .eq('email', email)
      .eq('otp_code', code)
      .eq('role', 'password_reset_guest')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (findError || !temp) return res.status(400).json({ error: 'Invalid or expired code' });

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    await supabase.from('temp_registrations').delete().eq('email', email).eq('role', 'password_reset_guest');

    res.json({ success: true });
  } catch (error: any) {
    console.error('Guest password complete error:', error);
    res.status(500).json({ error: 'Failed to process password change' });
  }
});

// --- TOUR ROUTES ---

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const file = req.file;
    const bucket = req.body.bucket || 'tours';
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileExt = file.originalname.split('.').pop() || 'tmp';
    const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    res.json({ url: data.publicUrl });
  } catch (error: any) {
    console.error('Proxy Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

app.get('/api/tours', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = supabase
      .from('tours')
      .select('*, profiles(name)')
      .eq('status', 'published');

    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data: tours, error } = await query.order('id', { ascending: false });

    if (error) throw error;

    // Supabase returns JSON fields correctly if they are defined as jsonb
    const formattedTours = tours.map((t: any) => ({
      ...t,
      operator_name: t.profiles?.name,
      languages: t.languages || [],
      highlights: t.highlights || [],
      included: t.included || [],
      not_included: t.not_included || [],
      gallery: t.gallery || [],
      itinerary: t.itinerary || [],
    }));

    res.json(formattedTours);
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/tours', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const {
    title, category, location, duration, description,
    price, maxGroupSize, itinerary, imageUrl, existingGallery, newGalleryUrls
  } = req.body;

  try {
    let finalImageUrl = imageUrl || 'https://storage.georgia.travel/images/nature-of-georgia.webp';
    let parsedExisting = existingGallery ? JSON.parse(existingGallery) : [];
    let parsedNew = newGalleryUrls ? JSON.parse(newGalleryUrls) : [];
    const finalGallery = [...parsedExisting, ...parsedNew];

    let itineraryData = itinerary ? JSON.parse(itinerary) : [];

    const { data, error } = await supabase
      .from('tours')
      .insert([
        {
          operator_id: payload.id,
          title, category, location, duration, description,
          price: price ? parseFloat(price) : null,
          max_group_size: maxGroupSize ? parseInt(maxGroupSize) : null,
          image: finalImageUrl,
          gallery: finalGallery,
          itinerary: itineraryData,
          status: 'published'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json({ id: data.id, success: true });
  } catch (error) {
    console.error('Error inserting tour:', error);
    res.status(500).json({ error: 'Failed to create tour' });
  }
});

app.get('/api/tours/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { data: tours, error } = await supabase
      .from('tours')
      .select('*')
      .eq('operator_id', payload.id)
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(tours);
  } catch (error) {
    console.error('Error fetching my tours:', error);
    res.status(500).json({ error: 'Failed to fetch tours' });
  }
});

app.put('/api/tours/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const {
    title, category, location, duration, description,
    price, maxGroupSize, itinerary, imageUrl, existingGallery, newGalleryUrls
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

    let parsedExisting = existingGallery ? JSON.parse(existingGallery) : [];
    let parsedNew = newGalleryUrls ? JSON.parse(newGalleryUrls) : [];
    updateData.gallery = [...parsedExisting, ...parsedNew];

    let itineraryData = itinerary ? JSON.parse(itinerary) : [];
    updateData.itinerary = itineraryData;

    const { data, error } = await supabase
      .from('tours')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('operator_id', payload.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ id: data.id, success: true });
  } catch (error) {
    console.error('Error updating tour:', error);
    res.status(500).json({ error: 'Failed to update tour' });
  }
});

app.put('/api/tours/:id/status', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { status } = req.body;
  if (!status || !['published', 'paused'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const { data, error } = await supabase
      .from('tours')
      .update({ status })
      .eq('id', req.params.id)
      .eq('operator_id', payload.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Tour not found or unauthorized' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating tour status:', error);
    res.status(500).json({ error: 'Failed to update tour status' });
  }
});

app.delete('/api/tours/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', req.params.id)
      .eq('operator_id', payload.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tour:', error);
    res.status(500).json({ error: 'Failed to delete tour' });
  }
});

app.get('/api/tours/:id', async (req, res) => {
  try {
    const { data: tour, error } = await supabase
      .from('tours')
      .select('*, profiles(name)')
      .eq('id', req.params.id)
      .single();

    if (error || !tour) return res.status(404).json({ error: 'Tour not found' });

    res.json({
      ...tour,
      operator_name: tour.profiles?.name
    });
  } catch (error) {
    console.error('Error fetching tour detail:', error);
    res.status(500).json({ error: 'Failed to fetch tour' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { tour_id, user_name, user_email, booking_date, guests, total_price } = req.body;
  if (!tour_id || !user_name || !user_email || !booking_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        { tour_id, user_name, user_email, booking_date, guests: guests || 1, total_price: total_price || 0 }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json({ id: data.id });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Booking failed' });
  }
});

app.get('/api/bookings/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, tours(title, image)')
      .eq('user_email', payload.email)
      .order('id', { ascending: false });

    if (error) throw error;

    const formattedBookings = bookings.map((b: any) => ({
      ...b,
      tour_title: b.tours?.title,
      tour_image: b.tours?.image
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tours')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    
    const categories = Array.from(new Set(data.map((c: any) => c.category)));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`--- Server listening on port ${PORT} ---`);
});

export default app;
