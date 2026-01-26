
async function main() {
    try {
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alias: 'admin', pin: 'password123' })
        });
        
        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('Login Success. Token obtained.');

        const meRes = await fetch('http://localhost:3000/users/me', {
             headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!meRes.ok) throw new Error(`Profile fetch failed: ${meRes.statusText}`);
        const meData = await meRes.json();
        console.log('Profile:', meData);
        
        if (meData.role !== 'ADMIN') {
            console.error('FAIL: Role is not ADMIN');
            process.exit(1);
        }
        console.log('SUCCESS: Admin access confirmed.');

    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
