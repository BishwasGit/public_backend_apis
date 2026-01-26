const axios = require('axios');

async function testAllAnalytics() {
    try {
        // Login first
        const loginRes = await axios.post('http://localhost:3000/v1/auth/login', {
            alias: 'admin1',
            pin: '1234'
        });
        
        const token = loginRes.data.access_token;
        console.log('✅ Logged in successfully\n');
        
        const endpoints = [
            '/analytics/summary',
            '/analytics/activity-graph',
            '/analytics/user-performance',
            '/analytics/retention',
            '/analytics/supply-demand',
            '/analytics/platform-health',
        ];
        
        for (const endpoint of endpoints) {
            console.log(`Testing ${endpoint}...`);
            try {
                const res = await axios.get(`http://localhost:3000/v1${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`✅ SUCCESS - Status: ${res.status}`);
            } catch (err) {
                console.error(`❌ FAILED - Status: ${err.response?.status}`);
                console.error(`   Error: ${err.response?.data?.message || err.message}`);
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAllAnalytics();
