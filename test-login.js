const axios = require('axios');

const API_URL = 'http://192.168.1.94:3000';

async function testLogin(alias, pin) {
  try {
    console.log(`\n🔐 Testing login for: ${alias}`);
    const response = await axios.post(`${API_URL}/auth/login`, {
      alias,
      pin,
    });
    console.log('✅ Login successful!');
    console.log('User:', response.data.user);
    console.log('Token:', response.data.access_token.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Login Endpoint');
  console.log('========================\n');

  // Test common PINs
  const testCases = [
    { alias: 'patient1', pin: '1234' },
    { alias: 'psychologist1', pin: '1234' },
    { alias: 'admin1', pin: '1234' },
  ];

  for (const test of testCases) {
    await testLogin(test.alias, test.pin);
  }
}

main();
