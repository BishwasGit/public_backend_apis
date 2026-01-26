const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Manually load .env if dotenv not available
try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log('Context: Loaded .env manually');
    }
} catch (e) {
    console.log('Context: Failed to load .env', e.message);
}

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, alias: true, email: true, role: true }
        });
        
        let output = 'List of Users:\n';
        users.forEach(u => {
            output += `Alias: ${u.alias} | Email: ${u.email} | Role: ${u.role}\n`;
        });
        
        fs.writeFileSync('users_list.txt', output);
        console.log('Users list written to users_list.txt');
    } catch (e) {
        console.error(e);
        fs.writeFileSync('users_list.txt', 'Error: ' + e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
