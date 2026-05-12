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

// Test connection in browser
if (typeof window !== 'undefined') {
  (async () => {
    try {
      console.log('[Frontend Supabase] Testing connection...');
      const { data, error } = await supabase.from('habits').select('id').limit(1);
      if (error) {
        console.error('[Frontend Supabase] Connection test failed:', error.message);
        console.error('[Frontend Supabase] Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      } else {
        console.log('[Frontend Supabase] Connection test successful');
      }
    } catch (err) {
      console.error('[Frontend Supabase] Connection test error:', err.message);
    }
  })();
}

export default supabase;
