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
    let output = '';
    try {
        const sessionCount = await prisma.session.count();
        const userCount = await prisma.user.count();
        const users = await prisma.user.findMany({ 
            select: { alias: true, bio: true, price: true, specialties: true } 
        });
        
        output += `Sessions: ${sessionCount}\n`;
        output += `Users: ${userCount}\n`;
        output += `User Details:\n`;
        users.forEach(u => {
             output += `- ${u.alias}: Bio=${u.bio}, Specs=${JSON.stringify(u.specialties)}\n`;
        });

        if (sessionCount === 0 && userCount === 3) {
             output += '\nRESULT: SUCCESS';
        } else {
             output += '\nRESULT: FAILED';
        }
    } catch (e) {
        output += `ERROR: ${e.message}`;
        console.error(e);
    } finally {
        try {
            const outPath = path.resolve(__dirname, '../verification_result.txt');
            fs.writeFileSync(outPath, output);
            console.log('Written to ' + outPath);
        } catch(err) {
            console.error('Failed to write file:', err);
        }
        await prisma.$disconnect();
    }
}
main();
