/**
 * Supabase Browser Client (Frontend)
 *
 * Uses the ANON key — safe to expose in the browser.
 * Row Level Security policies protect the data.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
  console.warn(
    '[FocusPulse] NEXT_PUBLIC_SUPABASE_URL not set in frontend/.env.local\n' +
    'Get it from: https://supabase.com → Project → Settings → API'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnon || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
