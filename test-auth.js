const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/v1/auth/login', {
      alias: 'psychologist1',
      pin: '1234'
    });
    console.log('Login response:', JSON.stringify(res.data, null, 2));
    
    const token = res.data.access_token;
    console.log('\nToken:', token);
    
    const groupRes = await axios.get('http://localhost:3000/v1/sessions/group/all', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('\nGroup sessions:', groupRes.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.headers) {
      console.error('Response headers:', error.response.headers);
    }
  }
}

test();
