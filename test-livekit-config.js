const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://192.168.1.94:3000/v1/auth/login', {
      alias: 'patient1',
      pin: '1234'
    });
    const token = loginRes.data.data.access_token;
    
    const configRes = await axios.get('http://192.168.1.94:3000/v1/video/config', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ LiveKit Config from Backend:');
    console.log('   Server URL:', configRes.data.serverUrl);
    console.log('');
    console.log('🌐 This URL should be accessible from other devices on the network!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test();
