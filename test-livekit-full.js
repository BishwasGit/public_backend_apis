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
    
    console.log('Full response:', JSON.stringify(configRes.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
