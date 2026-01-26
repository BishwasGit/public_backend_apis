
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'psychologist1'; // Using username/alias as email for finding for now? Or just findFirst where role=PSYCHOLOGIST
    // Actually, I'll list all psychologists and their wallets
    const pyc = await prisma.user.findFirst({
        where: { alias: 'psychologist1' }
    });

    if (!pyc) {
        console.log('Psychologist1 not found');
        const allUsers = await prisma.user.findMany({ select: { id: true, alias: true, role: true } });
        console.log('Available users:', allUsers);
        return;
    }

    console.log('Psychologist:', pyc.id, pyc.alias);

    const wallet = await prisma.wallet.findUnique({
        where: { userId: pyc.id },
        include: { transactions: true }
    });

    console.log('Wallet:', wallet);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
