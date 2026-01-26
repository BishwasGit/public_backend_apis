const axios = require('axios');

const BASE_URL = 'http://localhost:3000/v1';

async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            alias: 'admin1',
            pin: '1234'
        });
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        return null;
    }
}

async function testEndpoint(token, endpoint) {
    try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`❌ ${endpoint} - Status: ${error.response?.status || 'ERROR'}`);
        console.error(`   Error: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
            console.error(`   Details:`, JSON.stringify(error.response.data, null, 2));
        }
        return { success: false, error: error.response?.data || error.message };
    }
}

async function main() {
    console.log('🔍 Testing Analytics Endpoints\n');
    
    const token = await login();
    if (!token) {
        console.error('Cannot proceed without token');
        return;
    }
    
    console.log('✅ Authentication successful\n');
    
    const endpoints = [
        '/analytics/summary',
        '/analytics/activity-graph',
        '/analytics/user-performance',
        '/analytics/retention',
        '/analytics/supply-demand',
        '/analytics/platform-health',
    ];
    
    for (const endpoint of endpoints) {
        await testEndpoint(token, endpoint);
        console.log(''); // Empty line for readability
    }
}

main();
