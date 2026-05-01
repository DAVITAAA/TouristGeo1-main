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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const app = express();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const RESEND_ENABLED = !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your-resend-api-key';
console.log('--- SERVER CODE IS ACTIVE ---');
if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key') {
  console.warn('[WARN] RESEND_API_KEY is not set or using placeholder. Email sending is DISABLED.');
} else {
  console.log('[INFO] RESEND_API_KEY is detected. Email sending is ENABLED.');
}
console.log('[DEBUG] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'LOADED' : 'MISSING');
console.log('[DEBUG] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'LOADED' : 'MISSING');

const LOG_FILE = path.join(__dirname, 'error.log');

// Safe JSON stringify helper to prevent crashes with circular references
const safeStringify = (obj: any) => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return String(obj);
  }
};

const logError = (msg: string) => {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  console.error(entry);
  try {
    // Only attempt to write if we're not in a read-only environment like Netlify functions
    if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY) {
      fs.appendFileSync(LOG_FILE, entry);
    }
  } catch (e) {}
};

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection: ${reason}`);
});
process.on('uncaughtException', (err) => {
  logError(`Uncaught Exception: ${err.message}\n${err.stack}`);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
const upload = multer({ storage: multer.memoryStorage() });

// Global error handler will be moved to the end

app.get('/', (req, res) => res.send('TouristGeo API Server is running. Visit <a href="http://localhost:5173">port 5173</a> for the website.'));

// Diagnostics endpoint to help debug Netlify environment issues
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: {
      is_netlify: !!process.env.NETLIFY,
      is_production: process.env.NODE_ENV === 'production',
      google_client_id: process.env.GOOGLE_CLIENT_ID ? 'LOADED' : 'MISSING',
      supabase_url: (process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL) ? 'LOADED' : 'MISSING',
      supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'LOADED' : 'MISSING',
      resend_api_key: (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your-resend-api-key') ? 'LOADED' : 'MISSING'
    }
  });
});

// Simple Token Helper for Demo
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';
const createToken = (user: any) => {
  try {
    const payload = Buffer.from(JSON.stringify({ 
      id: user.id, 
      email: user.email, 
      role: user.role,
      exp: Date.now() + 86400000 
    })).toString('base64');
    return payload;
  } catch (e: any) {
    logError(`Token Creation Error: ${e.message}`);
    return 'error-token';
  }
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
    const { data: existingEmail } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (existingEmail) return res.status(400).json({ error: 'Email already registered' });

    if (name) {
      const { data: existingName } = await supabase.from('profiles').select('id').eq('name', name).single();
      if (existingName) return res.status(400).json({ error: 'Name already taken' });
    }

    if (company_name) {
      const { data: existingCompany } = await supabase.from('profiles').select('id').eq('company_name', company_name).single();
      if (existingCompany) return res.status(400).json({ error: 'Company name already taken' });
    }

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
        const { data, error: emailErr } = resend ? await resend.emails.send({
          from: 'TouristGeo <onboarding@resend.dev>',
          to: email,
          subject: 'TouristGeo - Verification Code',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;"><h1 style="color:#22c55e;text-align:center;">TouristGeo</h1><div style="text-align:center;padding:24px;background:#f0fdf4;border-radius:12px;"><p style="color:#6b7280;">Your verification code is:</p><div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#16a34a;padding:12px;">${otp}</div></div><p style="color:#9ca3af;font-size:12px;text-align:center;">This code expires in 10 minutes.</p></div>`,
        }) : { data: null, error: new Error('Resend client not initialized') };
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
    const errorMsg = error.message || 'Internal Server Error';
    logError(`Login Error: ${errorMsg}`);
    res.status(500).json({ 
        error: 'Login failed due to a server error.', 
        details: errorMsg,
        code: error.code || 'UNKNOWN'
    });
  }
});

// Google Auth
app.post('/api/auth/oauth-g', async (req, res) => {
  const { credential, role } = req.body;
  console.log('[GOOGLE_AUTH] Request received. Role:', role);

  try {
    if (!credential) throw new Error('Missing Google credential');

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new Error('Invalid Google payload');

    const { email, name, picture } = payload;
    console.log('[GOOGLE_AUTH] Verified email:', email);

    // Check if profile exists
    const { data: existingUser } = await supabase.from('profiles').select('*').eq('email', email).single();

    if (existingUser) {
      const userData = { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role, avatar_url: existingUser.avatar_url };
      return res.json({ user: userData, token: createToken(userData) });
    }

    // Create Auth User
    let authUserId = '';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: name || email.split('@')[0] },
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
         // User exists in Auth but not in Profiles - get their ID
         const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
         if (listError || !listData) {
            console.error('List users error:', listError);
            return res.status(500).json({ error: 'Failed to find existing account' });
         }
         const existingAuth = listData.users.find((u: any) => u.email === email);
         if (existingAuth) {
           authUserId = existingAuth.id;
         } else {
           return res.status(500).json({ error: 'Account exists but profile creation failed' });
         }
      } else {
        return res.status(500).json({ error: 'Failed to create account', details: authError.message });
      }
    } else {
      authUserId = authData.user.id;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert([{ 
        id: authUserId, 
        name: name || email.split('@')[0], 
        email, 
        role: role || 'tourist', 
        avatar_url: picture || null 
      }], { onConflict: 'id' })
      .select().single();

    if (profileError) {
      console.error('--- GOOGLE PROFILE ERROR ---', profileError);
      logError(`Google Profile Error: ${safeStringify(profileError)}`);
      try {
        await supabase.auth.admin.deleteUser(authUserId);
      } catch (e) {}
      return res.status(500).json({ error: 'Failed to create profile', details: profileError.message, code: profileError.code });
    }
    logError('[DEBUG] Google Auth: Success!');
    const userData = { id: profileData.id, name: profileData.name, email: profileData.email, role: profileData.role, avatar_url: profileData.avatar_url };
    return res.json({ user: userData, token: createToken(userData) });
  } catch (error: any) {
    const errorMsg = error.message || (typeof error === 'string' ? error : 'Google Authentication failed');
    const errorCode = error.code || 'AUTH_FAILURE';
    const errorDetails = error.details || (error.response ? safeStringify(error.response.data) : 'No extra details');
    
    logError(`Google Auth Fatal: ${errorMsg}\nCode: ${errorCode}\nDetails: ${errorDetails}\nFull Error: ${safeStringify(error)}`);
    console.error('[DEBUG] FULL GOOGLE AUTH ERROR:', error);

    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Google login failed', 
        details: errorMsg,
        extra: errorDetails,
        code: errorCode,
        hint: !process.env.GOOGLE_CLIENT_ID ? 'GOOGLE_CLIENT_ID environment variable is missing on server.' : undefined
      });
    }
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
    .select('id, name, email, company_name, phone, avatar_url, role, is_verified, verification_status')
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    let query = supabase
      .from('tours')
      .select('*, profiles(name, company_name, is_verified, phone)')
      .eq('status', 'published')
      .gte('created_at', thirtyDaysAgo);

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
      company_name: t.profiles?.company_name,
      is_verified: t.profiles?.is_verified,
      phone: t.phone || t.profiles?.phone,
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
    price, full_price, difficulty, languages, maxGroupSize, itinerary, imageUrl, existingGallery, newGalleryUrls, phone
  } = req.body;

  try {
    let finalImageUrl = imageUrl || 'https://storage.georgia.travel/images/nature-of-georgia.webp';
    let parsedExisting = existingGallery ? JSON.parse(existingGallery) : [];
    let parsedNew = newGalleryUrls ? JSON.parse(newGalleryUrls) : [];
    const finalGallery = [...parsedExisting, ...parsedNew];

    let itineraryData = itinerary ? JSON.parse(itinerary) : [];
    let parsedLanguages = languages ? JSON.parse(languages) : ['English'];

    const { data, error } = await supabase
      .from('tours')
      .insert([
        {
          operator_id: payload.id,
          title, category, location, duration, description,
          price: price ? parseFloat(price) : null,
          full_price: full_price ? parseFloat(full_price) : null,
          difficulty: difficulty || null,
          languages: parsedLanguages,
          max_group_size: maxGroupSize ? parseInt(maxGroupSize) : null,
          image: finalImageUrl,
          gallery: finalGallery,
          itinerary: itineraryData,
          phone: phone,
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: tours, error } = await supabase
      .from('tours')
      .select('*')
      .eq('operator_id', payload.id)
      .gte('created_at', thirtyDaysAgo)
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(tours);
  } catch (error) {
    console.error('Error fetching my tours:', error);
    res.status(500).json({ error: 'Failed to fetch my tours' });
  }
});

app.get('/api/tours/my-expired', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: tours, error } = await supabase
      .from('tours')
      .select('*')
      .eq('operator_id', payload.id)
      .lt('created_at', thirtyDaysAgo)
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(tours);
  } catch (error) {
    console.error('Error fetching expired tours:', error);
    res.status(500).json({ error: 'Failed to fetch expired tours' });
  }
});

app.put('/api/tours/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const {
    title, category, location, duration, description,
    price, full_price, difficulty, languages, maxGroupSize, itinerary, imageUrl, existingGallery, newGalleryUrls, phone
  } = req.body;

  try {
    let parsedLanguages = languages ? JSON.parse(languages) : undefined;
    let updateData: any = {
      title, category, location, duration, description,
      price: price ? parseFloat(price) : null,
      full_price: full_price ? parseFloat(full_price) : null,
      difficulty: difficulty || null,
      max_group_size: maxGroupSize ? parseInt(maxGroupSize) : null,
      phone: phone,
    };
    if (parsedLanguages) updateData.languages = parsedLanguages;

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

app.post('/api/tours/:id/renew', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { data: tour } = await supabase.from('tours').select('operator_id').eq('id', req.params.id).single();
    if (!tour || tour.operator_id !== payload.id) return res.status(403).json({ error: 'Forbidden' });

    const { error } = await supabase
      .from('tours')
      .update({ created_at: new Date().toISOString() })
      .eq('id', req.params.id);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Renew tour error:', error);
    res.status(500).json({ error: error.message || 'Failed to renew tour' });
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
      .select('*, profiles(name, company_name, is_verified, phone)')
      .eq('id', req.params.id)
      .single();

    if (error || !tour) return res.status(404).json({ error: 'Tour not found' });

    res.json({
      ...tour,
      operator_name: tour.profiles?.name,
      company_name: tour.profiles?.company_name,
      is_verified: tour.profiles?.is_verified,
      phone: tour.phone || tour.profiles?.phone
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


app.post('/api/auth/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  const { document_url } = req.body;
  if (!document_url) return res.status(400).json({ error: 'Document URL is required' });

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_status: 'pending',
        verification_document: document_url 
      })
      .eq('id', payload.id);

    if (error) throw error;
    res.json({ success: true, message: 'Verification request submitted' });
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

const ADMIN_EMAIL = 'datonaxucrishvili64@gmail.com';

app.get('/api/admin/verifications', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload || payload.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', 'pending');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
});

app.post('/api/admin/verify/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload || payload.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Forbidden' });

  const { status, message } = req.body; // status: 'verified' or 'rejected'

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_status: status,
        is_verified: status === 'verified'
      })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating verification:', error);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

// --- RESERVATIONS ROUTES ---

app.post('/api/reservations', async (req, res) => {
  const { tour_id, tour_title, tour_image, tour_location, operator_id, tourist_name, tourist_surname, tourist_phone, tourist_email, guests, start_date, duration_days, description } = req.body;
  
  const missing = [];
  if (!tour_id) missing.push('tour_id');
  if (!operator_id) missing.push('operator_id');
  if (!tourist_name) missing.push('tourist_name');
  if (!start_date) missing.push('start_date');

  if (missing.length > 0) {
    console.error('Missing reservation fields:', missing, 'Body:', req.body);
    fs.appendFileSync('error.log', `[${new Date().toISOString()}] Missing reservation fields: ${missing.join(', ')} - Body: ${JSON.stringify(req.body)}\n`);
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert([
        { tour_id, tour_title, tour_image, tour_location, operator_id, tourist_name, tourist_surname, tourist_phone, tourist_email, guests, start_date, duration_days, description, status: 'new' }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error creating reservation:', error);
    fs.appendFileSync('reservation_error.log', `[${new Date().toISOString()}] Error creating reservation: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
    res.status(500).json({ error: 'Reservation failed' });
  }
});

app.get('/api/reservations/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('operator_id', payload.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

app.get('/api/reservations/unread-count', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { count, error } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('operator_id', payload.id)
      .eq('status', 'new');

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error counting reservations:', error);
    res.status(500).json({ error: 'Failed to count reservations' });
  }
});

app.patch('/api/reservations/:id/read', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'read' })
      .eq('id', req.params.id)
      .eq('operator_id', payload.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

app.patch('/api/reservations/read-all', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'read' })
      .eq('operator_id', payload.id)
      .eq('status', 'new');

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating reservations:', error);
    res.status(500).json({ error: 'Failed to update reservations' });
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
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
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
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
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

// --- RESERVATIONS ROUTES ---

app.post('/api/reservations', async (req, res) => {
  const { tour_id, tour_title, tour_image, tour_location, operator_id, tourist_name, tourist_surname, tourist_phone, tourist_email, guests, start_date, duration_days, description } = req.body;
  
  const missing = [];
  if (!tour_id) missing.push('tour_id');
  if (!operator_id) missing.push('operator_id');
  if (!tourist_name) missing.push('tourist_name');
  if (!start_date) missing.push('start_date');

  if (missing.length > 0) {
    console.error('Missing reservation fields:', missing, 'Body:', req.body);
    fs.appendFileSync('error.log', `[${new Date().toISOString()}] Missing reservation fields: ${missing.join(', ')} - Body: ${JSON.stringify(req.body)}\n`);
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert([
        { tour_id, tour_title, tour_image, tour_location, operator_id, tourist_name, tourist_surname, tourist_phone, tourist_email, guests, start_date, duration_days, description, status: 'new' }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error creating reservation:', error);
    fs.appendFileSync('reservation_error.log', `[${new Date().toISOString()}] Error creating reservation: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}\n`);
    res.status(500).json({ error: 'Reservation failed' });
  }
});

app.get('/api/reservations/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('operator_id', payload.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

app.get('/api/reservations/unread-count', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { count, error } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('operator_id', payload.id)
      .eq('status', 'new');

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error counting reservations:', error);
    res.status(500).json({ error: 'Failed to count reservations' });
  }
});

app.patch('/api/reservations/:id/read', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'read' })
      .eq('id', req.params.id)
      .eq('operator_id', payload.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

app.patch('/api/reservations/read-all', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'read' })
      .eq('operator_id', payload.id)
      .eq('status', 'new');

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating reservations:', error);
    res.status(500).json({ error: 'Failed to update reservations' });
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

app.get('/api/tours/:id/reviews', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(name, avatar_url)')
      .eq('tour_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Parse guest names if any
    const parsedData = data.map(review => {
      if (review.comment && review.comment.startsWith('[GUEST:')) {
         const match = review.comment.match(/^\[GUEST:([^\]]+)\]\s*(.*)$/s);
         if (match) {
           return {
             ...review,
             comment: match[2].trim(),
             profiles: { ...review.profiles, name: match[1] }
           };
         }
      }
      return review;
    });

    res.json(parsedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (payload) userId = payload.id;
  }

  const { tour_id, rating, comment, guest_name } = req.body;
  if (!tour_id || !rating) return res.status(400).json({ error: 'Tour ID and rating are required' });
  
  if (!userId && !guest_name) {
    return res.status(400).json({ error: 'Guest name is required if not logged in' });
  }

  const GUEST_ID = '9c190cba-b49d-484f-a708-75ad623083e8';
  const finalUserId = userId || GUEST_ID;
  const finalComment = (!userId && guest_name) ? `[GUEST:${guest_name}] ${comment}` : comment;

  try {
    // 1. Insert the review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert([{
        tour_id,
        user_id: finalUserId,
        rating: Number(rating),
        comment: finalComment,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // 2. Update the Tour's average rating
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('tour_id', tour_id);

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((acc: any, curr: any) => acc + curr.rating, 0) / allReviews.length;
      await supabase
        .from('tours')
        .update({ 
          rating: Number(avgRating.toFixed(1)), 
          reviews: allReviews.length 
        })
        .eq('id', tour_id);

      // 3. Automated Verification Logic: Check if operator meets 50+ reviews & 4.5+ average
      const { data: tourData } = await supabase.from('tours').select('operator_id').eq('id', tour_id).single();
      if (tourData?.operator_id) {
        const { data: operatorTours } = await supabase.from('tours').select('id').eq('operator_id', tourData.operator_id);
        if (operatorTours && operatorTours.length > 0) {
          const tourIds = operatorTours.map(t => t.id);
          const { data: opReviews } = await supabase.from('reviews').select('rating').in('tour_id', tourIds);
          
          if (opReviews && opReviews.length >= 50) {
            const totalAvg = opReviews.reduce((acc, curr) => acc + curr.rating, 0) / opReviews.length;
            if (totalAvg >= 4.5) {
              await supabase
                .from('profiles')
                .update({ is_verified: true, verification_status: 'verified' })
                .eq('id', tourData.operator_id);
            }
          }
        }
      }
    }

    res.json(review);
  } catch (error: any) {
    logError(`Review Error: ${error.message}`);
    res.status(500).json({ error: 'Failed to post review', details: error.message });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload || payload.role !== 'operator') return res.status(403).json({ error: 'Forbidden' });

  try {
    // Check if the operator owns the tour associated with this review
    const { data: review } = await supabase.from('reviews').select('tour_id').eq('id', req.params.id).single();
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const { data: tour } = await supabase.from('tours').select('operator_id').eq('id', review.tour_id).single();
    if (!tour || tour.operator_id !== payload.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this tour' });
    }

    const { error } = await supabase.from('reviews').delete().eq('id', req.params.id);
    if (error) throw error;

    // Recalculate average rating
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('tour_id', review.tour_id);
    const avgRating = allReviews && allReviews.length > 0 
      ? allReviews.reduce((acc: any, curr: any) => acc + curr.rating, 0) / allReviews.length 
      : 0;
    
    await supabase.from('tours').update({ 
      rating: Number(avgRating.toFixed(1)), 
      reviews: allReviews ? allReviews.length : 0 
    }).eq('id', review.tour_id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete review', details: error.message });
  }
});

// Global error handler for Express
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError(`Express Error: ${err.message}\n${err.stack}`);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.NETLIFY && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`--- Server listening on port ${PORT} ---`);
  });
}

export default app;
