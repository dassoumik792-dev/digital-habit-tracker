/**
 * Supabase Admin Client (Backend)
 *
 * Uses SERVICE ROLE key — bypasses RLS for trusted server operations.
 * NEVER send this key to the frontend.
 */

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || url.includes('your-project-id')) {
  console.error('\n─────────────────────────────────────────────────────');
  console.error('❌  SUPABASE_URL not configured in backend/.env');
  console.error('   1. Go to https://supabase.com → your project');
  console.error('   2. Settings → API → copy Project URL');
  console.error('   3. Paste as SUPABASE_URL in backend/.env');
  console.error('   4. Copy service_role key → SUPABASE_SERVICE_ROLE_KEY');
  console.error('─────────────────────────────────────────────────────\n');
}

const supabase = createClient(url || '', key || '', {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Test connection at startup
(async () => {
  try {
    console.log('[Supabase] Testing connection...');
    const { data, error } = await supabase.from('habits').select('id').limit(1);
    if (error) {
      console.error('[Supabase] Connection test failed:', error.message);
      if (error.message.includes('relation "public.habits" does not exist')) {
        console.error('[Supabase] HINT: Run schema.sql in Supabase SQL Editor');
      }
    } else {
      console.log('[Supabase] Connection test successful');
    }
  } catch (err) {
    console.error('[Supabase] Connection test error:', err.message);
  }
})();

module.exports = supabase;
