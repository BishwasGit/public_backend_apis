const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(category, test, passed, details = '') {
  results.tests.push({ category, test, passed, details });
  if (passed) {
    results.passed++;
    log(`  ✅ ${test}`, 'green');
  } else {
    results.failed++;
    log(`  ❌ ${test} - ${details}`, 'red');
  }
}

async function testAll() {
  log('\n🧪 COMPREHENSIVE SYSTEM TEST', 'cyan');
  log('='.repeat(70), 'blue');
  
  let adminToken = '';
  let psychToken = '';
  let patientToken = '';

  // ============================================
  // 1. TEST AUTHENTICATION & DTO VALIDATION
  // ============================================
  log('\n📋 1. Authentication & DTO Validation', 'yellow');
  
  try {
    // Test invalid input (DTO validation)
    await axios.post(`${BASE_URL}/auth/login`, { alias: 'ab', pin: '123' });
    recordTest('Auth', 'DTO Validation (should fail)', false, 'Did not validate');
  } catch (error) {
    if (error.response?.status === 400) {
      recordTest('Auth', 'DTO Validation', true);
    } else {
      recordTest('Auth', 'DTO Validation', false, error.message);
    }
  }

  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, { alias: 'admin1', pin: '1234' });
    adminToken = res.data.access_token;
    recordTest('Auth', 'Admin Login', !!adminToken);
  } catch (error) {
    recordTest('Auth', 'Admin Login', false, error.message);
  }

  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, { alias: 'psychologist1', pin: '1234' });
    psychToken = res.data.access_token;
    recordTest('Auth', 'Psychologist Login', !!psychToken);
  } catch (error) {
    recordTest('Auth', 'Psychologist Login', false, error.message);
  }

  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, { alias: 'patient1', pin: '1234' });
    patientToken = res.data.access_token;
    recordTest('Auth', 'Patient Login', !!patientToken);
  } catch (error) {
    recordTest('Auth', 'Patient Login', false, error.message);
  }

  // ============================================
  // 2. TEST CORE MODULES
  // ============================================
  log('\n📋 2. Core Modules', 'yellow');

  try {
    const res = await axios.get(`${BASE_URL}/users`);
    recordTest('Users', 'Get All Users', res.status === 200 && res.data.length > 0);
  } catch (error) {
    recordTest('Users', 'Get All Users', false, error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/profile/psychologists`);
    recordTest('Profile', 'Get Psychologists', res.status === 200 && Array.isArray(res.data));
  } catch (error) {
    recordTest('Profile', 'Get Psychologists', false, error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/wallet/balance`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    recordTest('Wallet', 'Get Balance', res.status === 200 && typeof res.data.balance === 'number');
  } catch (error) {
    recordTest('Wallet', 'Get Balance', false, error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/sessions`, {
      headers: { Authorization: `Bearer ${psychToken}` }
    });
    recordTest('Session', 'Get Sessions', res.status === 200);
  } catch (error) {
    recordTest('Session', 'Get Sessions', false, error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/service-options/my`, {
      headers: { Authorization: `Bearer ${psychToken}` }
    });
    recordTest('Service Options', 'Get My Options', res.status === 200);
  } catch (error) {
    recordTest('Service Options', 'Get My Options', false, error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/media-manager/folders`, {
      headers: { Authorization: `Bearer ${psychToken}` }
    });
    recordTest('Media Manager', 'List Folders', res.status === 200);
  } catch (error) {
    recordTest('Media Manager', 'List Folders', false, error.message);
  }

  try {
    const res = await axios.post(`${BASE_URL}/video/token`, 
      { roomName: 'test-room' },
      { headers: { Authorization: `Bearer ${patientToken}` } }
    );
    recordTest('Video', 'Generate Token', res.status === 201 && !!res.data.token);
  } catch (error) {
    recordTest('Video', 'Generate Token', false, error.message);
  }

  // ============================================
  // 3. TEST ANALYTICS MODULE (ALL 11 ENDPOINTS)
  // ============================================
  log('\n📋 3. Analytics Module (11 Endpoints)', 'yellow');

  const analyticsEndpoints = [
    'overview',
    'summary',
    'activity-graph',
    'user-performance',
    'retention',
    'supply-demand',
    'platform-health',
    'revenue',
    'user-growth',
    'realtime',
    'sessions/stats',
    'wallet/stats'
  ];

  for (const endpoint of analyticsEndpoints) {
    try {
      const res = await axios.get(`${BASE_URL}/analytics/${endpoint}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      recordTest('Analytics', endpoint, res.status === 200);
    } catch (error) {
      recordTest('Analytics', endpoint, false, error.response?.status || error.message);
    }
  }

  // ============================================
  // 4. TEST SECURITY FEATURES
  // ============================================
  log('\n📋 4. Security Features', 'yellow');

  // Test unauthorized access
  try {
    await axios.get(`${BASE_URL}/wallet/balance`);
    recordTest('Security', 'JWT Protection', false, 'Allowed without token');
  } catch (error) {
    if (error.response?.status === 401) {
      recordTest('Security', 'JWT Protection', true);
    } else {
      recordTest('Security', 'JWT Protection', false, error.message);
    }
  }

  // Test global exception filter
  try {
    await axios.post(`${BASE_URL}/auth/login`, { alias: 'invalid', pin: 'wrong' });
    recordTest('Security', 'Exception Filter', false, 'No error thrown');
  } catch (error) {
    const hasStructuredError = error.response?.data?.statusCode && 
                               error.response?.data?.timestamp &&
                               error.response?.data?.path;
    recordTest('Security', 'Exception Filter', hasStructuredError);
  }

  // Test rate limiting (make multiple requests)
  log('  ⏳ Testing rate limiting (this may take a moment)...', 'cyan');
  let rateLimitHit = false;
  try {
    for (let i = 0; i < 105; i++) {
      await axios.get(`${BASE_URL}/profile/psychologists`);
    }
  } catch (error) {
    if (error.response?.status === 429) {
      rateLimitHit = true;
    }
  }
  recordTest('Security', 'Rate Limiting (100/min)', rateLimitHit);

  // ============================================
  // 5. TEST SWAGGER DOCUMENTATION
  // ============================================
  log('\n📋 5. Swagger Documentation', 'yellow');

  try {
    const res = await axios.get(`${BASE_URL}/api/docs`);
    recordTest('Swagger', 'Documentation Page', res.status === 200);
  } catch (error) {
    recordTest('Swagger', 'Documentation Page', false, error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/api/docs-json`);
    const hasEndpoints = res.data.paths && Object.keys(res.data.paths).length > 0;
    recordTest('Swagger', 'API Specification', hasEndpoints);
  } catch (error) {
    recordTest('Swagger', 'API Specification', false, error.message);
  }

  // ============================================
  // 6. TEST CORS
  // ============================================
  log('\n📋 6. CORS Configuration', 'yellow');

  try {
    const res = await axios.get(`${BASE_URL}/profile/psychologists`, {
      headers: { 'Origin': 'http://localhost:3001' }
    });
    const corsEnabled = res.headers['access-control-allow-origin'] === '*' ||
                       res.headers['access-control-allow-origin'] === 'http://localhost:3001';
    recordTest('CORS', 'Frontend Access', corsEnabled);
  } catch (error) {
    recordTest('CORS', 'Frontend Access', false, error.message);
  }

  // ============================================
  // 7. TEST DATABASE
  // ============================================
  log('\n📋 7. Database & Seed Data', 'yellow');

  try {
    const res = await axios.get(`${BASE_URL}/users`);
    recordTest('Database', 'Users Seeded', res.data.length === 33);
  } catch (error) {
    recordTest('Database', 'Users Seeded', false, error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/profile/psychologists`);
    const verified = res.data.filter(p => p.isVerified).length;
    recordTest('Database', 'Verified Psychologists', verified === 5);
  } catch (error) {
    recordTest('Database', 'Verified Psychologists', false, error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/sessions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    recordTest('Database', 'Sessions Seeded', Array.isArray(res.data) && res.data.length > 0);
  } catch (error) {
    recordTest('Database', 'Sessions Seeded', false, error.message);
  }

  // ============================================
  // FINAL SUMMARY
  // ============================================
  log('\n' + '='.repeat(70), 'blue');
  log('\n📊 FINAL TEST RESULTS', 'cyan');
  log('='.repeat(70), 'blue');
  
  log(`\nTotal Tests: ${results.passed + results.failed}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`, 'yellow');

  if (results.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.tests.filter(t => !t.passed).forEach(t => {
      log(`   ${t.category}: ${t.test} - ${t.details}`, 'red');
    });
  }

  log('\n✅ Test Summary by Category:', 'green');
  const categories = [...new Set(results.tests.map(t => t.category))];
  categories.forEach(cat => {
    const catTests = results.tests.filter(t => t.category === cat);
    const catPassed = catTests.filter(t => t.passed).length;
    log(`   ${cat}: ${catPassed}/${catTests.length}`, catPassed === catTests.length ? 'green' : 'yellow');
  });

  log('\n' + '='.repeat(70), 'blue');
  log('🎉 Testing Complete!', 'green');
  log('='.repeat(70) + '\n', 'blue');
}

testAll().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
