const axios = require('axios');

async function testAnalytics() {
    try {
        // Login first
        const loginRes = await axios.post('http://localhost:3000/v1/auth/login', {
            alias: 'admin1',
            pin: '1234'
        });
        
        const token = loginRes.data.access_token;
        console.log('✅ Logged in successfully\n');
        
        // Test activity-graph
        console.log('Testing /analytics/activity-graph...');
        try {
            const res = await axios.get('http://localhost:3000/v1/analytics/activity-graph', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ SUCCESS:', JSON.stringify(res.data, null, 2));
        } catch (err) {
            console.error('❌ FAILED:');
            console.error('Status:', err.response?.status);
            console.error('Error:', err.response?.data);
            console.error('Message:', err.response?.data?.message);
        }
        
        console.log('\n---\n');
        
        // Test supply-demand
        console.log('Testing /analytics/supply-demand...');
        try {
            const res = await axios.get('http://localhost:3000/v1/analytics/supply-demand', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ SUCCESS:', JSON.stringify(res.data, null, 2));
        } catch (err) {
            console.error('❌ FAILED:');
            console.error('Status:', err.response?.status);
            console.error('Error:', err.response?.data);
            console.error('Message:', err.response?.data?.message);
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAnalytics();
