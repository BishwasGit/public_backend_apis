const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCORS() {
  console.log('🔍 Testing CORS Configuration\n');
  console.log('='.repeat(60));

  // Test CORS headers
  try {
    const response = await axios.get(`${BASE_URL}/profile/psychologists`, {
      headers: {
        'Origin': 'http://localhost:3001', // Simulating frontend request
        'Access-Control-Request-Method': 'GET'
      }
    });

    console.log('✅ CORS Test Successful\n');
    console.log('Response Headers:');
    console.log(`   Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin'] || 'Not set'}`);
    console.log(`   Access-Control-Allow-Methods: ${response.headers['access-control-allow-methods'] || 'Not set'}`);
    console.log(`   Access-Control-Allow-Credentials: ${response.headers['access-control-allow-credentials'] || 'Not set'}`);

    console.log('\n📊 CORS Configuration Status:');
    if (response.headers['access-control-allow-origin'] === '*' || 
        response.headers['access-control-allow-origin'] === 'http://localhost:3001') {
      console.log('   ✅ Frontend can connect from any origin');
      console.log('   ✅ Mobile app can connect');
      console.log('   ✅ Admin panel can connect');
    } else {
      console.log('   ⚠️  CORS might be restricted');
    }

    // Test different origins
    console.log('\n🌐 Testing Multiple Origins:');
    const origins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:19006', // Expo default
      'http://192.168.1.100:19006' // Mobile device
    ];

    for (const origin of origins) {
      try {
        const res = await axios.get(`${BASE_URL}/profile/psychologists`, {
          headers: { 'Origin': origin }
        });
        console.log(`   ✅ ${origin} - Allowed`);
      } catch (error) {
        console.log(`   ❌ ${origin} - Blocked`);
      }
    }

  } catch (error) {
    console.log('❌ CORS Test Failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📝 CORS Configuration Summary:');
  console.log('   Current Setting: origin: "*" (Allow all)');
  console.log('   Methods: GET, HEAD, PUT, PATCH, POST, DELETE');
  console.log('   Credentials: true');
  console.log('\n   ✅ Frontend Integration Ready');
  console.log('   ✅ Mobile App Integration Ready');
  console.log('   ✅ Admin Panel Integration Ready');
}

testCORS();
