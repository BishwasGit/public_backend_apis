const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authTokens = {};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${message}`, 'blue');
  log(`${'='.repeat(60)}`, 'blue');
}

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(moduleName, testName, passed, error = null) {
  results.tests.push({ moduleName, testName, passed, error });
  if (passed) {
    results.passed++;
    logSuccess(`${moduleName}: ${testName}`);
  } else {
    results.failed++;
    logError(`${moduleName}: ${testName} - ${error}`);
  }
}

async function testAuthModule() {
  logSection('Testing Auth Module');
  
  try {
    // Test Signup
    const signupRes = await axios.post(`${BASE_URL}/auth/signup`, {
      alias: 'testuser' + Date.now(),
      pin: '1234',
      role: 'PATIENT'
    });
    recordTest('Auth', 'Signup', signupRes.status === 201);
  } catch (error) {
    recordTest('Auth', 'Signup', false, error.response?.data?.message || error.message);
  }

  try {
    // Test Login - Patient
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      alias: 'patient1',
      pin: '1234'
    });
    authTokens.patient = loginRes.data.access_token;
    recordTest('Auth', 'Login (Patient)', !!authTokens.patient);
  } catch (error) {
    recordTest('Auth', 'Login (Patient)', false, error.response?.data?.message || error.message);
  }

  try {
    // Test Login - Psychologist
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      alias: 'psychologist1',
      pin: '1234'
    });
    authTokens.psychologist = loginRes.data.access_token;
    recordTest('Auth', 'Login (Psychologist)', !!authTokens.psychologist);
  } catch (error) {
    recordTest('Auth', 'Login (Psychologist)', false, error.response?.data?.message || error.message);
  }

  try {
    // Test Login - Admin
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      alias: 'admin1',
      pin: '1234'
    });
    authTokens.admin = loginRes.data.access_token;
    recordTest('Auth', 'Login (Admin)', !!authTokens.admin);
  } catch (error) {
    recordTest('Auth', 'Login (Admin)', false, error.response?.data?.message || error.message);
  }
}

async function testUsersModule() {
  logSection('Testing Users Module');

  try {
    const res = await axios.get(`${BASE_URL}/users`);
    recordTest('Users', 'Get All Users', res.status === 200 && Array.isArray(res.data));
  } catch (error) {
    recordTest('Users', 'Get All Users', false, error.response?.data?.message || error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/users?role=PSYCHOLOGIST`);
    recordTest('Users', 'Filter by Role', res.status === 200 && res.data.every(u => u.role === 'PSYCHOLOGIST'));
  } catch (error) {
    recordTest('Users', 'Filter by Role', false, error.response?.data?.message || error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${authTokens.patient}` }
    });
    recordTest('Users', 'Get Current User', res.status === 200 && res.data.alias === 'patient1');
  } catch (error) {
    recordTest('Users', 'Get Current User', false, error.response?.data?.message || error.message);
  }
}

async function testProfileModule() {
  logSection('Testing Profile Module');

  try {
    const res = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${authTokens.psychologist}` }
    });
    recordTest('Profile', 'Get Own Profile', res.status === 200);
  } catch (error) {
    recordTest('Profile', 'Get Own Profile', false, error.response?.data?.message || error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/profile/psychologists`);
    recordTest('Profile', 'Search Psychologists', res.status === 200 && Array.isArray(res.data));
  } catch (error) {
    recordTest('Profile', 'Search Psychologists', false, error.response?.data?.message || error.message);
  }

  try {
    const res = await axios.patch(`${BASE_URL}/profile`, {
      bio: 'Updated bio for testing'
    }, {
      headers: { Authorization: `Bearer ${authTokens.psychologist}` }
    });
    recordTest('Profile', 'Update Profile', res.status === 200);
  } catch (error) {
    recordTest('Profile', 'Update Profile', false, error.response?.data?.message || error.message);
  }
}

async function testWalletModule() {
  logSection('Testing Wallet Module');

  try {
    const res = await axios.get(`${BASE_URL}/wallet/balance`, {
      headers: { Authorization: `Bearer ${authTokens.patient}` }
    });
    recordTest('Wallet', 'Get Balance', res.status === 200 && typeof res.data.balance === 'number');
  } catch (error) {
    recordTest('Wallet', 'Get Balance', false, error.response?.data?.message || error.message);
  }

  try {
    const res = await axios.post(`${BASE_URL}/wallet/deposit`, {
      amount: 100
    }, {
      headers: { Authorization: `Bearer ${authTokens.patient}` }
    });
    recordTest('Wallet', 'Deposit Funds', res.status === 201);
  } catch (error) {
    recordTest('Wallet', 'Deposit Funds', false, error.response?.data?.message || error.message);
  }

  try {
    const res = await axios.get(`${BASE_URL}/wallet/transactions`, {
      headers: { Authorization: `Bearer ${authTokens.patient}` }
    });
    recordTest('Wallet', 'Get Transactions', res.status === 200 && Array.isArray(res.data));
  } catch (error) {
    recordTest('Wallet', 'Get Transactions', false, error.response?.data?.message || error.message);
  }
}

async function testServiceOptionsModule() {
  logSection('Testing Service Options Module');

  try {
    const res = await axios.get(`${BASE_URL}/service-options/my`, {
      headers: { Authorization: `Bearer ${authTokens.psychologist}` }
    });
    recordTest('Service Options', 'Get My Options', res.status === 200 && Array.isArray(res.data));
  } catch (error) {
    recordTest('Service Options', 'Get My Options', false, error.response?.data?.message || error.message);
  }

  try {
    const res = await axios.post(`${BASE_URL}/service-options`, {
      name: 'Test Video Session',
      description: 'Test session for API verification',
      price: 100,
      duration: 60,
      type: 'VIDEO',
      billingType: 'PER_SESSION'
    }, {
      headers: { Authorization: `Bearer ${authTokens.psychologist}` }
    });
    recordTest('Service Options', 'Create Service Option', res.status === 201);
  } catch (error) {
    recordTest('Service Options', 'Create Service Option', false, error.response?.data?.message || error.message);
  }
}

async function testSessionModule() {
  logSection('Testing Session Module');

  try {
    const res = await axios.get(`${BASE_URL}/sessions`, {
      headers: { Authorization: `Bearer ${authTokens.patient}` }
    });
    recordTest('Session', 'Get My Sessions', res.status === 200 && Array.isArray(res.data));
  } catch (error) {
    recordTest('Session', 'Get My Sessions', false, error.response?.data?.message || error.message);
  }

  try {
    // Get a psychologist ID first
    const psychRes = await axios.get(`${BASE_URL}/profile/psychologists`);
    if (psychRes.data.length > 0) {
      const psychId = psychRes.data[0].id;
      const res = await axios.get(`${BASE_URL}/sessions/available/${psychId}`);
      recordTest('Session', 'Get Available Sessions', res.status === 200);
    } else {
      recordTest('Session', 'Get Available Sessions', false, 'No psychologists found');
    }
  } catch (error) {
    recordTest('Session', 'Get Available Sessions', false, error.response?.data?.message || error.message);
  }

  try {
    const res = await axios.post(`${BASE_URL}/sessions`, {
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 90000000).toISOString(),
      price: 100
    }, {
      headers: { Authorization: `Bearer ${authTokens.psychologist}` }
    });
    recordTest('Session', 'Create Session', res.status === 201);
  } catch (error) {
    recordTest('Session', 'Create Session', false, error.response?.data?.message || error.message);
  }
}

async function testMediaManagerModule() {
  logSection('Testing Media Manager Module');

  try {
    const res = await axios.get(`${BASE_URL}/media-manager/folders`, {
      headers: { Authorization: `Bearer ${authTokens.psychologist}` }
    });
    recordTest('Media Manager', 'List Folders', res.status === 200 && Array.isArray(res.data));
  } catch (error) {
    recordTest('Media Manager', 'List Folders', false, error.response?.data?.message || error.message);
  }

  try {
    const res = await axios.post(`${BASE_URL}/media-manager/folders`, {
      name: 'Test Folder'
    }, {
      headers: { Authorization: `Bearer ${authTokens.psychologist}` }
    });
    recordTest('Media Manager', 'Create Folder', res.status === 201);
  } catch (error) {
    recordTest('Media Manager', 'Create Folder', false, error.response?.data?.message || error.message);
  }
}

async function testVideoModule() {
  logSection('Testing Video Module');

  try {
    const res = await axios.post(`${BASE_URL}/video/token`, {
      roomName: 'test-room-' + Date.now()
    }, {
      headers: { Authorization: `Bearer ${authTokens.patient}` }
    });
    recordTest('Video', 'Generate Token', res.status === 201 && !!res.data.token);
  } catch (error) {
    recordTest('Video', 'Generate Token', false, error.response?.data?.message || error.message);
  }
}

async function testAnalyticsModule() {
  logSection('Testing Analytics Module');
  
  try {
    // Check if analytics endpoint exists
    const res = await axios.get(`${BASE_URL}/analytics`, {
      headers: { Authorization: `Bearer ${authTokens.admin}` }
    });
    recordTest('Analytics', 'Get Analytics', res.status === 200);
  } catch (error) {
    if (error.response?.status === 404) {
      recordTest('Analytics', 'Get Analytics', false, 'Endpoint not implemented');
    } else {
      recordTest('Analytics', 'Get Analytics', false, error.response?.data?.message || error.message);
    }
  }
}

async function runAllTests() {
  log('\n🧪 Starting Comprehensive API Testing\n', 'cyan');
  log('Backend URL: ' + BASE_URL, 'yellow');
  log('Test Start Time: ' + new Date().toLocaleString(), 'yellow');
  
  try {
    await testAuthModule();
    await testUsersModule();
    await testProfileModule();
    await testWalletModule();
    await testServiceOptionsModule();
    await testSessionModule();
    await testMediaManagerModule();
    await testVideoModule();
    await testAnalyticsModule();
  } catch (error) {
    logError('Fatal error during testing: ' + error.message);
  }

  // Print summary
  logSection('Test Summary');
  log(`Total Tests: ${results.passed + results.failed}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, 'red');
  log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`, 'yellow');
  
  if (results.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.tests.filter(t => !t.passed).forEach(t => {
      log(`   - ${t.moduleName}: ${t.testName}`, 'red');
      if (t.error) log(`     Error: ${t.error}`, 'yellow');
    });
  }
  
  log('\n✅ Testing completed!', 'green');
  log('Test End Time: ' + new Date().toLocaleString(), 'yellow');
}

// Run tests
runAllTests().catch(error => {
  logError('Test suite failed: ' + error.message);
  process.exit(1);
});
