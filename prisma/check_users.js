const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Manually load .env if available
try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    }
} catch (e) {}

async function main() {
    try {
        const aliases = ['admin1', 'patient1', 'psychologist1'];
        const users = await prisma.user.findMany({
            where: { alias: { in: aliases } },
            select: { alias: true }
        });
        
        const found = users.map(u => u.alias);
        fs.writeFileSync('check_result.txt', `Found: ${found.join(', ')}`);
    } catch (e) {
        fs.writeFileSync('check_result.txt', 'Error: ' + e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
