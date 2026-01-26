const axios = require('axios');

const BASE_URL = 'http://localhost:3000/v1';

async function test() {
  console.log('🧪 Testing Group Sessions & LiveKit Integration\n');

  try {
    // 1. Login as psychologist
    console.log('1. Logging in as psychologist...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      alias: 'psychologist1',
      pin: '1234'
    });
    const token = loginRes.data.data.access_token;
    console.log('   ✅ Logged in successfully\n');

    // 2. Check existing group sessions
    console.log('2. Fetching existing group sessions...');
    const groupRes = await axios.get(`${BASE_URL}/sessions/group/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const groups = groupRes.data.data || groupRes.data;
    console.log(`   ✅ Found ${groups.length} group session(s)`);
    groups.forEach((g, i) => {
      console.log(`      ${i + 1}. ${g.title || 'Untitled'} - ${new Date(g.startTime).toLocaleString()}`);
      console.log(`         Participants: ${g.participants?.length || 0}/${g.maxParticipants}`);
    });
    console.log('');

    // 3. Create a new group session
    console.log('3. Creating a new group session...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const endTime = new Date(tomorrow);
    endTime.setHours(15, 0, 0, 0);

    const createRes = await axios.post(`${BASE_URL}/sessions`, {
      title: 'Stress Management Workshop',
      type: 'GROUP',
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      price: 45,
      maxParticipants: 8
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✅ Group session created:', createRes.data.id);
    console.log('');

    // 4. Test LiveKit token generation
    console.log('4. Testing LiveKit token generation...');
    const tokenRes = await axios.post(`${BASE_URL}/video/token`, {
      roomName: 'test-room-' + Date.now()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tokenData = tokenRes.data.data || tokenRes.data;
    console.log('   ✅ LiveKit token generated successfully');
    console.log('   Server URL:', tokenData.serverUrl || 'ws://localhost:7880');
    console.log('   Token preview:', tokenData.token.substring(0, 50) + '...');
    console.log('');

    // 5. Login as patient and check group sessions
    console.log('5. Logging in as patient to view group sessions...');
    const patientLogin = await axios.post(`${BASE_URL}/auth/login`, {
      alias: 'patient1',
      pin: '1234'
    });
    const patientToken = patientLogin.data.data.access_token;

    const patientGroupRes = await axios.get(`${BASE_URL}/sessions/group/all`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const patientGroups = patientGroupRes.data.data || patientGroupRes.data;
    console.log(`   ✅ Patient can see ${patientGroups.length} available group session(s)`);
    console.log('');

    console.log('✅ All tests passed!\n');
    console.log('📋 Summary:');
    console.log('   - Group sessions API: Working');
    console.log('   - Session creation: Working');
    console.log('   - LiveKit integration: Working');
    console.log('   - Patient access: Working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

test();
