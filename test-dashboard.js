/**
 * Dashboard Loading Test Script
 * Tests the complete flow from backend to frontend
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test user credentials (you'll need to create this user first)
const TEST_USER = {
  email: 'test@example.com',
  password: 'test123456'
};

async function testBackendHealth() {
  console.log('🔍 Testing backend health...');
  try {
    const response = await axios.get('http://localhost:5000/health');
    console.log('✅ Backend is healthy:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend is not running or not accessible:', error.message);
    return false;
  }
}

async function testUserLogin() {
  console.log('🔑 Testing user login...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    if (response.data.success) {
      console.log('✅ User login successful');
      return response.data.token;
    } else {
      console.error('❌ Login failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return null;
  }
}

async function testAnalyticsEndpoints(token) {
  console.log('📊 Testing analytics endpoints...');
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    // Test overview endpoint
    const overview = await axios.get(`${API_URL}/analytics/overview`, { headers });
    console.log('✅ Overview endpoint works:', overview.data.success ? 'Success' : 'Failed');
    
    // Test weekly endpoint  
    const weekly = await axios.get(`${API_URL}/analytics/weekly`, { headers });
    console.log('✅ Weekly endpoint works:', weekly.data.success ? 'Success' : 'Failed');
    
    return {
      overview: overview.data,
      weekly: weekly.data
    };
  } catch (error) {
    console.error('❌ Analytics endpoint error:', error.response?.data || error.message);
    return null;
  }
}

async function testSeedData(token) {
  console.log('🌱 Testing seed data...');
  const headers = { Authorization: `Bearer ${token}` };
  
  try {
    const response = await axios.post(`${API_URL}/habits/seed-demo`, {}, { headers });
    console.log('✅ Seed data works:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Seed data error:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Dashboard Loading Tests\n');
  
  // Test 1: Backend health
  const backendOk = await testBackendHealth();
  if (!backendOk) {
    console.log('\n❌ Please start the backend server first:');
    console.log('   cd backend && npm start');
    return;
  }
  
  // Test 2: User login (you need to create a test user first)
  console.log('\n⚠️  Note: Make sure you have a test user registered first');
  console.log('   You can register via the frontend or API');
  
  const token = await testUserLogin();
  if (!token) {
    console.log('\n❌ Cannot proceed without valid user token');
    return;
  }
  
  // Test 3: Analytics endpoints with empty data
  console.log('\n📈 Testing with empty data...');
  const emptyResults = await testAnalyticsEndpoints(token);
  
  // Test 4: Seed data
  console.log('\n🌱 Seeding test data...');
  const seeded = await testSeedData(token);
  
  // Test 5: Analytics endpoints with data
  if (seeded) {
    console.log('\n📈 Testing with seeded data...');
    const dataResults = await testAnalyticsEndpoints(token);
    
    if (dataResults) {
      console.log('\n✅ Dashboard should now load successfully!');
      console.log('   - Overview data:', Object.keys(dataResults.overview.data || {}));
      console.log('   - Weekly data points:', dataResults.weekly.data?.chartData?.length || 0);
    }
  }
  
  console.log('\n🎉 Tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
