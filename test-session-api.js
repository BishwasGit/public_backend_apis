const axios = require('axios');

async function test() {
  try {
    // Login as patient1
    const loginRes = await axios.post('http://localhost:3000/v1/auth/login', {
      alias: 'patient1',
      pin: '1234'
    });
    const token = loginRes.data.data.access_token;
    
    console.log('✅ Logged in as patient1\n');
    
    // Get session details
    const sessionRes = await axios.get('http://localhost:3000/v1/sessions/209cc486-21ac-441f-b860-af1f51d4d749', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const session = sessionRes.data.data || sessionRes.data;
    
    console.log('Session Response:');
    console.log('  ID:', session.id);
    console.log('  Type:', session.type);
    console.log('  Status:', session.status);
    console.log('  Psychologist:', session.psychologist?.alias);
    console.log('  Patient:', session.patient?.alias || 'None');
    console.log('  Participants:', session.participants?.length || 0);
    
    if (session.participants && session.participants.length > 0) {
      console.log('\nParticipants:');
      session.participants.forEach(p => {
        console.log('  -', p.alias, '(ID:', p.id + ')');
      });
    }
    
    // Check if patient1 is in participants
    const patient1Id = '251c2c47-58b2-4142-8874-a284c59c3836';
    const isParticipant = session.participants?.some(p => p.id === patient1Id);
    
    console.log('\n✅ Patient1 is participant:', isParticipant);
    console.log('✅ Should show Join button:', isParticipant && session.status === 'LIVE');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test();
