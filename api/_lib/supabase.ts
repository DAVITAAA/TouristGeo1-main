import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('CRITICAL: Supabase environment variables are missing on Vercel!');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '');
