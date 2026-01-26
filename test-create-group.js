const axios = require('axios');

async function test() {
  try {
    // Login as psychologist
    const loginRes = await axios.post('http://localhost:3000/v1/auth/login', {
      alias: 'psychologist1',
      pin: '1234'
    });
    const token = loginRes.data.data.access_token;
    console.log('✅ Logged in as psychologist1\n');

    // Create a group session with future time
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 2); // 2 hours from now
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    console.log('Creating group session:');
    console.log('  Start time (local):', startTime.toString());
    console.log('  Start time (ISO):', startTime.toISOString());
    console.log('  End time (ISO):', endTime.toISOString());
    console.log('');

    const createRes = await axios.post('http://localhost:3000/v1/sessions', {
      title: 'Mindfulness & Meditation Workshop',
      type: 'GROUP',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      price: 35,
      maxParticipants: 12
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const session = createRes.data.data || createRes.data;
    console.log('✅ Group session created:', session.id);
    console.log('');

    // Check if it appears in group sessions list
    const groupRes = await axios.get('http://localhost:3000/v1/sessions/group/all', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const groups = groupRes.data.data || groupRes.data;
    console.log(`Found ${groups.length} available group sessions:`);
    groups.forEach((g, i) => {
      const start = new Date(g.startTime);
      console.log(`  ${i + 1}. ${g.title}`);
      console.log(`     Start: ${start.toLocaleString()}`);
      console.log(`     Participants: ${g.participants?.length || 0}/${g.maxParticipants}`);
    });
    console.log('');

    // Verify the new session is in the list
    const found = groups.find(g => g.id === session.id);
    if (found) {
      console.log('✅ NEW SESSION IS VISIBLE in group sessions list!');
    } else {
      console.log('❌ NEW SESSION NOT FOUND in group sessions list');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test();
