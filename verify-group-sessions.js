const axios = require('axios');

async function verify() {
  try {
    console.log('🔍 GROUP SESSION VERIFICATION TOOL\n');
    console.log('Current time:', new Date().toString());
    console.log('Current UTC:', new Date().toISOString());
    console.log('═'.repeat(60));
    
    // Login as psychologist
    const loginRes = await axios.post('http://localhost:3000/v1/auth/login', {
      alias: 'psychologist1',
      pin: '1234'
    });
    const token = loginRes.data.data.access_token;
    
    // Fetch group sessions from API
    const res = await axios.get('http://localhost:3000/v1/sessions/group/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const sessions = res.data.data || res.data;
    
    console.log(`\n📊 API Returns: ${sessions.length} group session(s)\n`);
    
    if (sessions.length === 0) {
      console.log('❌ No sessions found!');
      console.log('\nThis means:');
      console.log('  - No GROUP sessions exist with status SCHEDULED or LIVE');
      console.log('  - OR all sessions have start times in the past');
      console.log('\n💡 TIP: Create a new session with a FUTURE start time!');
    } else {
      sessions.forEach((s, i) => {
        const startDate = new Date(s.startTime);
        const now = new Date();
        const hoursUntil = (startDate - now) / (1000 * 60 * 60);
        
        console.log(`${i + 1}. ${s.title || 'Untitled'}`);
        console.log(`   Status: ${s.status}`);
        console.log(`   Start: ${startDate.toLocaleString()}`);
        console.log(`   UTC: ${s.startTime}`);
        console.log(`   Time until start: ${hoursUntil.toFixed(2)} hours`);
        console.log(`   Participants: ${s.participants?.length || 0}/${s.maxParticipants}`);
        console.log(`   Price: $${s.price}`);
        console.log('');
      });
      
      console.log('✅ These sessions WILL appear on /find-psychologist!');
    }
    
    console.log('═'.repeat(60));
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Go to http://localhost:5173/find-psychologist');
    console.log('2. Click "Group Sessions" tab');
    console.log('3. Click "Refresh" button if needed');
    console.log('4. You should see the sessions listed above');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

verify();
