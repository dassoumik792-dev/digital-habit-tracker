/**
 * Quick Fix Test Script
 * Run this to identify the exact issue
 */

// Test 1: Check Environment Variables
console.log('=== ENVIRONMENT CHECK ===');
console.log('Backend SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
console.log('Backend SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');

// Test 2: Backend Connection Test
const supabase = require('./backend/config/supabase');

async function testBackendConnection() {
  console.log('\n=== BACKEND CONNECTION TEST ===');
  try {
    const { data, error } = await supabase.from('habits').select('count').single();
    if (error) {
      console.error('❌ Backend connection failed:', error.message);
      if (error.message.includes('relation "public.habits" does not exist')) {
        console.error('🔧 FIX: Run schema.sql in Supabase SQL Editor');
      }
      if (error.message.includes('JWT') || error.message.includes('auth')) {
        console.error('🔧 FIX: Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      }
    } else {
      console.log('✅ Backend connection successful');
    }
  } catch (err) {
    console.error('❌ Backend connection error:', err.message);
  }
}

// Test 3: API Endpoint Test
async function testAPIEndpoint() {
  console.log('\n=== API ENDPOINT TEST ===');
  try {
    const response = await fetch('http://localhost:5000/api/analytics/overview');
    const data = await response.json();
    if (response.ok) {
      console.log('✅ API responding:', data.success ? 'SUCCESS' : 'FAILED');
      if (!data.success) {
        console.error('❌ API Error:', data.message);
      }
    } else {
      console.error('❌ API HTTP Error:', response.status);
    }
  } catch (err) {
    console.error('❌ API Connection failed:', err.message);
    console.error('🔧 FIX: Start backend server with `npm start`');
  }
}

// Test 4: Frontend Environment Check
console.log('\n=== FRONTEND ENV CHECK ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

// Run all tests
(async () => {
  await testBackendConnection();
  await testAPIEndpoint();
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Fix any ❌ issues above');
  console.log('2. Restart both frontend and backend');
  console.log('3. Check browser console for connection tests');
  console.log('4. Check backend console for query logs');
})();
