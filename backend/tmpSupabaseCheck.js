require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const userId = 'd071c544-02ac-4d18-9761-362834b2fa4a';
  const a = await supabase.from('auth.users').select('id,email,raw_user_meta_data').eq('id', userId);
  const b = await supabase.from('users').select('*').eq('id', userId);
  console.log('auth.users', JSON.stringify(a, null, 2));
  console.log('public.users', JSON.stringify(b, null, 2));
})();