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
    console.log('💀 Starting DEEP database reset...');
    try {
        console.log('...Deleting dependent data...');
        // Delete all dependent/activity data
        await prisma.review.deleteMany({});
        await prisma.message.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.withdrawalRequest.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.calendarEvent.deleteMany({});
        await prisma.auditLog.deleteMany({});
        await prisma.mediaFile.deleteMany({});
        await prisma.mediaFolder.deleteMany({});
        await prisma.payoutMethod.deleteMany({});
        await prisma.serviceOption.deleteMany({});

        // Delete all users EXCEPT preserved
        const preserved = ['admin1', 'patient1', 'psychologist1'];
        console.log('...Deleting non-preserved users');
        await prisma.wallet.deleteMany({
            where: { user: { alias: { notIn: preserved } } }
        });
        await prisma.user.deleteMany({
            where: { alias: { notIn: preserved } }
        });

        // Reset Profile Fields for Preserved Users
        console.log('...Resetting profiles for preserved users');
        
        // Reset Admin
        await prisma.user.updateMany({
            where: { alias: 'admin1' },
            data: { 
                bio: null, specialties: [], languages: [], 
                price: null, hourlyRate: null, 
                isVerified: true, hasAcceptedTerms: true 
            }
        });
        
        // Reset Patient
        await prisma.user.updateMany({
            where: { alias: 'patient1' },
            data: { 
                bio: null, specialties: [], languages: [], 
                price: null, hourlyRate: null, 
                // Resetting demographics too?
                dateOfBirth: null, gender: null,
                isVerified: true 
            }
        });

        // Reset Psychologist
        await prisma.user.updateMany({
            where: { alias: 'psychologist1' },
            data: { 
                bio: null, specialties: [], languages: [], 
                price: null, hourlyRate: null, 
                demoMinutes: 0,
                isVerified: true // Keep verified so they can log in? or false? I'll keep true as they are "test" users
            }
        });

        // Reset Wallets
        console.log('...Resetting wallets');
        // Admin & Psych -> 0
        const zeroWallets = await prisma.user.findMany({ where: { alias: { in: ['admin1', 'psychologist1'] } } });
        for(const u of zeroWallets) {
            await prisma.wallet.upsert({
                where: { userId: u.id },
                create: { userId: u.id, balance: 0 },
                update: { balance: 0 }
            });
        }
        // Patient -> 1000 (re-seed amount)
        const patient = await prisma.user.findFirst({ where: { alias: 'patient1' } });
        if(patient) {
             await prisma.wallet.upsert({
                where: { userId: patient.id },
                create: { userId: patient.id, balance: 1000 },
                update: { balance: 1000 }
            });
        }

        console.log('✅ Deep reset complete.');
    } catch (e) {
        console.error('❌ Reset failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
