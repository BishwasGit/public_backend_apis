const axios = require('axios');

const BASE_URL = 'http://localhost:3000/v1';

// Get a token first
async function login() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            alias: 'admin1',
            pin: '1234'
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        return null;
    }
}

async function testAnalytics() {
    console.log('🧪 Testing Analytics Endpoints...\n');
    
    const token = await login();
    if (!token) {
        console.error('❌ Failed to get auth token');
        return;
    }
    
    console.log('✅ Got auth token\n');
    
    const endpoints = [
        '/analytics/summary',
        '/analytics/activity-graph',
        '/analytics/user-performance',
        '/analytics/retention',
        '/analytics/supply-demand',
        '/analytics/platform-health'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`✅ ${endpoint}`);
            console.log(`   Response:`, JSON.stringify(response.data).substring(0, 100) + '...\n');
        } catch (error) {
            console.error(`❌ ${endpoint}`);
            console.error(`   Error:`, error.response?.status, error.response?.data?.message || error.message);
            console.error(`   Full error:`, error.response?.data || error.message, '\n');
        }
    }
}

testAnalytics();
