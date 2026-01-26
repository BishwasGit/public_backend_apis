const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://192.168.1.94:3000/v1/auth/login', {
      alias: 'patient1',
      pin: '1234'
    });
    const token = loginRes.data.data.access_token;
    
    console.log('Testing Video Token Generation...\n');
    
    const tokenRes = await axios.post('http://192.168.1.94:3000/v1/video/token', {
      roomName: 'test-room-123'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = tokenRes.data.data || tokenRes.data;
    
    console.log('✅ Token Response:');
    console.log('   Room Name:', data.roomName);
    console.log('   Server URL:', data.serverUrl);
    console.log('   Token (first 50 chars):', data.token?.substring(0, 50) + '...');
    console.log('');
    console.log('📡 Client should connect to:', data.serverUrl);
    console.log('');
    
    if (data.serverUrl !== 'ws://192.168.1.94:7880') {
      console.log('⚠️  WARNING: Server URL should be ws://192.168.1.94:7880 for network access!');
    } else {
      console.log('✅ Server URL is correctly configured for network access!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test();
