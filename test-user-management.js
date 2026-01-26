const axios = require('axios');

async function testUserManagementAndAudit() {
    console.log('🧪 Testing User Management & Audit Logging System\n');
    
    let token;
    let createdUserId;
    
    try {
        // Test 1: Login
        console.log('1️⃣ Testing Login...');
        const loginRes = await axios.post('http://localhost:3000/v1/auth/login', {
            alias: 'admin1',
            pin: '1234'
        });
        token = loginRes.data.access_token;
        console.log('✅ Login successful\n');
        
        // Test 2: Create User
        console.log('2️⃣ Testing User Creation...');
        try {
            const createRes = await axios.post('http://localhost:3000/v1/users', {
                alias: `testuser_${Date.now()}`,
                role: 'PATIENT',
                pin: '1234'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            createdUserId = createRes.data.id;
            console.log('✅ User created:', createRes.data.alias);
            console.log('   User ID:', createdUserId, '\n');
        } catch (err) {
            console.log('❌ User creation failed:', err.response?.data?.message || err.message, '\n');
        }
        
        // Test 3: List Users
        console.log('3️⃣ Testing User Listing...');
        const usersRes = await axios.get('http://localhost:3000/v1/users?limit=5', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Users retrieved:', usersRes.data.data?.length || 0);
        console.log('   Total users:', usersRes.data.meta?.total || 0, '\n');
        
        // Test 4: Get Audit Logs
        console.log('4️⃣ Testing Audit Logs...');
        const auditRes = await axios.get('http://localhost:3000/v1/audit-logs?limit=5', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Audit logs retrieved:', auditRes.data.data?.length || 0);
        console.log('   Total logs:', auditRes.data.total || 0);
        
        if (auditRes.data.data?.length > 0) {
            const latestLog = auditRes.data.data[0];
            console.log('   Latest action:', latestLog.action);
            console.log('   Entity:', latestLog.entity);
            console.log('   User:', latestLog.user?.alias || 'System', '\n');
        }
        
        // Test 5: Filter Audit Logs by Entity
        console.log('5️⃣ Testing Audit Log Filtering (Entity=USER)...');
        const filteredRes = await axios.get('http://localhost:3000/v1/audit-logs?entity=USER&limit=5', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Filtered logs retrieved:', filteredRes.data.data?.length || 0, '\n');
        
        // Test 6: Filter Audit Logs by Action
        console.log('6️⃣ Testing Audit Log Filtering (Action=LOGIN)...');
        const loginLogsRes = await axios.get('http://localhost:3000/v1/audit-logs?action=LOGIN&limit=5', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Login logs retrieved:', loginLogsRes.data.data?.length || 0, '\n');
        
        // Test 7: Update User (if created)
        if (createdUserId) {
            console.log('7️⃣ Testing User Update...');
            try {
                const updateRes = await axios.patch(`http://localhost:3000/v1/users/${createdUserId}`, {
                    bio: 'Test user bio - updated'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ User updated successfully\n');
            } catch (err) {
                console.log('❌ User update failed:', err.response?.data?.message || err.message, '\n');
            }
        }
        
        // Test 8: Delete User (if created)
        if (createdUserId) {
            console.log('8️⃣ Testing User Deletion (Soft Delete)...');
            try {
                await axios.delete(`http://localhost:3000/v1/users/${createdUserId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ User soft deleted successfully\n');
            } catch (err) {
                console.log('❌ User deletion failed:', err.response?.data?.message || err.message, '\n');
            }
        }
        
        // Test 9: Restore User (if created and deleted)
        if (createdUserId) {
            console.log('9️⃣ Testing User Restoration...');
            try {
                await axios.patch(`http://localhost:3000/v1/users/${createdUserId}/restore`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ User restored successfully\n');
            } catch (err) {
                console.log('❌ User restoration failed:', err.response?.data?.message || err.message, '\n');
            }
        }
        
        // Test 10: Verify Audit Trail
        console.log('🔟 Verifying Audit Trail for Created User...');
        if (createdUserId) {
            const userAuditRes = await axios.get(`http://localhost:3000/v1/audit-logs?entityId=${createdUserId}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Audit trail for user:', userAuditRes.data.data?.length || 0, 'events');
            
            if (userAuditRes.data.data?.length > 0) {
                console.log('\n   Audit Trail:');
                userAuditRes.data.data.forEach((log, idx) => {
                    console.log(`   ${idx + 1}. ${log.action} - ${new Date(log.createdAt).toLocaleString()}`);
                });
            }
        }
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
    }
}

testUserManagementAndAudit();
