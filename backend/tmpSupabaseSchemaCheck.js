require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

(async () => {
  const tables = ['habits', 'users', 'notifications', 'auth.users'];
  for (const table of tables) {
    try {
      const res = await supabase.from(table).select('id').limit(1);
      console.log(`table=${table}`, JSON.stringify(res, null, 2));
    } catch (err) {
      console.error(`table=${table} error`, err.message);
    }
  }

  try {
    const info = await supabase
      .from('information_schema.tables')
      .select('table_schema,table_name')
      .eq('table_schema', 'public')
      .limit(50);
    console.log('public tables', JSON.stringify(info, null, 2));
  } catch (err) {
    console.error('information_schema query error', err.message);
  }
})();