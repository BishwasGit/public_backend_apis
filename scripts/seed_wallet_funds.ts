import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('💰 Seeding wallets with dummy funds...');

    const users = await prisma.user.findMany();

    for (const user of users) {
        // 1. Ensure wallet exists
        let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
        if (!wallet) {
            wallet = await prisma.wallet.create({ data: { userId: user.id } });
        }

        // 2. Add dummy funds if balance is low
        if (wallet.balance < 500) {
            // Add random amount between 1000 and 5000
            const topUp = Math.floor(Math.random() * 4000) + 1000;
            await prisma.$transaction([
                prisma.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { increment: topUp } }
                }),
                prisma.transaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: topUp,
                        type: 'DEPOSIT',
                        status: 'COMPLETED',
                        description: 'Welcome Bonus / Seed Fund'
                    }
                })
            ]);
            console.log(`   + Added $${topUp} to ${user.alias} (${user.role})`);
        } else {
            console.log(`   - ${user.alias} already has sufficient funds ($${wallet.balance})`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
