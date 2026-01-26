const axios = require('axios');

async function test() {
  try {
    console.log('Testing Patient Session Access\n');
    
    // Login as patient1
    const loginRes = await axios.post('http://localhost:3000/v1/auth/login', {
      alias: 'patient1',
      pin: '1234'
    });
    
    const token = loginRes.data.data.access_token;
    const user = loginRes.data.data.user;
    
    console.log('Logged in as:', user.alias);
    console.log('User ID:', user.id);
    console.log('User Role:', user.role);
    console.log('');
    
    // Fetch the specific session
    const sessionRes = await axios.get('http://localhost:3000/v1/sessions/209cc486-21ac-441f-b860-af1f51d4d749', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const session = sessionRes.data.data || sessionRes.data;
    
    console.log('Session Details:');
    console.log('  ID:', session.id);
    console.log('  Type:', session.type);
    console.log('  Status:', session.status);
    console.log('  Patient ID:', session.patientId);
    console.log('  Participants:');
    if (session.participants) {
      session.participants.forEach(p => {
        console.log(`    - ${p.alias} (${p.id})`);
      });
    }
    console.log('');
    
    // Check conditions
    const isPatient = user.role === 'PATIENT' && (
      session.patientId === user.id ||
      session.participants?.some(p => p.id === user.id)
    );
    
    const isSessionLive = session.status === 'LIVE';
    
    const patientCanJoin = isPatient && (
      isSessionLive || 
      (session.status === 'SCHEDULED' && session.type === 'GROUP')
    );
    
    console.log('Checks:');
    console.log('  isPatient:', isPatient);
    console.log('  isSessionLive:', isSessionLive);
    console.log('  patientCanJoin:', patientCanJoin);
    console.log('');
    
    if (patientCanJoin) {
      console.log('✅ Patient SHOULD see "Join Session" button');
    } else {
      console.log('❌ Patient should NOT see "Join Session" button');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
