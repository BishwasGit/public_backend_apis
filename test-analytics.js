const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAnalyticsEndpoints() {
  console.log('🧪 Testing Analytics Module\n');
  console.log('=' .repeat(60));

  // First, login to get JWT token
  let token = '';
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      alias: 'admin1',
      pin: '1234'
    });
    token = loginRes.data.access_token;
    console.log('✅ Logged in as admin1\n');
  } catch (error) {
    console.error('❌ Failed to login:', error.message);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  // Test all analytics endpoints
  const endpoints = [
    { name: 'Overview', url: '/analytics/overview' },
    { name: 'Summary (Legacy)', url: '/analytics/summary' },
    { name: 'Activity Graph (7 days)', url: '/analytics/activity-graph' },
    { name: 'Activity Graph (30 days)', url: '/analytics/activity-graph?days=30' },
    { name: 'User Performance (Top 5)', url: '/analytics/user-performance' },
    { name: 'User Performance (Top 10)', url: '/analytics/user-performance?limit=10' },
    { name: 'Retention', url: '/analytics/retention' },
    { name: 'Supply & Demand', url: '/analytics/supply-demand' },
    { name: 'Platform Health', url: '/analytics/platform-health' },
    { name: 'Revenue (Month)', url: '/analytics/revenue' },
    { name: 'Revenue (Week)', url: '/analytics/revenue?period=week' },
    { name: 'User Growth (30 days)', url: '/analytics/user-growth' },
    { name: 'User Growth (7 days)', url: '/analytics/user-growth?days=7' },
    { name: 'Real-time Stats', url: '/analytics/realtime' },
    { name: 'Session Statistics', url: '/analytics/sessions/stats' },
    { name: 'Wallet Statistics', url: '/analytics/wallet/stats' }
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(`${BASE_URL}${endpoint.url}`, { headers });
      console.log(`✅ ${endpoint.name}`);
      console.log(`   Response: ${JSON.stringify(res.data).substring(0, 100)}...`);
      passed++;
    } catch (error) {
      console.log(`❌ ${endpoint.name}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   Total: ${endpoints.length}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success Rate: ${Math.round(passed / endpoints.length * 100)}%`);

  // Test a detailed endpoint
  if (passed > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('📈 Sample Analytics Data (Overview):\n');
    try {
      const res = await axios.get(`${BASE_URL}/analytics/overview`, { headers });
      console.log(JSON.stringify(res.data, null, 2));
    } catch (error) {
      console.log('Could not fetch overview data');
    }
  }
}

testAnalyticsEndpoints();
