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
        const sessionCount = await prisma.session.count();
        const userCount = await prisma.user.count();
        const users = await prisma.user.findMany({ select: { alias: true, bio: true } });
        
        console.log(` Sessions: ${sessionCount}`);
        console.log(` Users: ${userCount}`);
        console.log(' User details:', users);

        if (sessionCount === 0 && userCount === 3) {
             console.log('VERIFICATION: SUCCESS');
        } else {
             console.log('VERIFICATION: FAILED - Counts do not match expectations.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
