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
    console.log('🔥 Starting database wipe...');
    try {
        // 1. Wipe Activity Data (Order matters for foreign keys)
        console.log('...Deleting Reviews');
        await prisma.review.deleteMany({});
        
        console.log('...Deleting Messages');
        await prisma.message.deleteMany({});
        
        console.log('...Deleting Notifications');
        await prisma.notification.deleteMany({});
        
        console.log('...Deleting Withdrawal Requests');
        await prisma.withdrawalRequest.deleteMany({});
        
        console.log('...Deleting Transactions');
        await prisma.transaction.deleteMany({});
        
        console.log('...Deleting Sessions');
        await prisma.session.deleteMany({});
        
        console.log('...Deleting Calendar Events');
        await prisma.calendarEvent.deleteMany({});
        
        console.log('...Deleting Audit Logs');
        await prisma.auditLog.deleteMany({});

        console.log('...Deleting Media Files');
        await prisma.mediaFile.deleteMany({});
        console.log('...Deleting Media Folders');
        await prisma.mediaFolder.deleteMany({});

        // 2. Wipe Users EXCEPT the preserved ones
        const preservedAliases = ['admin1', 'patient1', 'psychologist1'];
        console.log(`...Deleting Users except: ${preservedAliases.join(', ')}`);
        
        // Delete tokens/other user related if any? (schema doesn't show separate token table linked)
        
        // Delete wallets of non-preserved users first?
        // Wallet depends on User. If we delete User, Wallet should cascade?
        // Let's delete Wallets of users we are about to delete, just to be safe if cascade isn't on.
        await prisma.wallet.deleteMany({
            where: {
                user: {
                    alias: {
                        notIn: preservedAliases
                    }
                }
            }
        });

        // Delete Users
        await prisma.user.deleteMany({
            where: {
                alias: {
                    notIn: preservedAliases
                }
            }
        });

        // 3. Reset preserved users (optional: reset wallet balance?)
        // User asked to "wipe all activity... keeping only login credentials".
        // I will reset wallet balance to 0 for consistency, or maybe 1000 for patient1 to be usable.
        // Let's reset to defaults: Admin=0, Psych=0, Patient=1000.
        
        // Update Patient1
        const patient = await prisma.user.findUnique({ where: { alias: 'patient1' } });
        if (patient) {
            await prisma.wallet.update({
                where: { userId: patient.id },
                data: { balance: 1000 }
            });
        }
        
        // Update Others
        const others = await prisma.user.findMany({ 
            where: { 
                alias: { in: ['admin1', 'psychologist1'] } 
            } 
        });
        for (const u of others) {
            await prisma.wallet.update({
                where: { userId: u.id },
                data: { balance: 0 }
            });
        }

        console.log('✅ Wipe complete.');
        fs.writeFileSync('wipe_status.txt', 'SUCCESS');
    } catch (e) {
        console.error(e);
        fs.writeFileSync('wipe_status.txt', 'ERROR: ' + e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
