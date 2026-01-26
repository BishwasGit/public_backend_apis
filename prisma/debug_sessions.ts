import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
    const latest = await prisma.session.findFirst({
        orderBy: { createdAt: 'desc' },
    });
    console.log('--- LATEST SESSION ---');
    console.log(JSON.stringify(latest, null, 2));

    const now = new Date();
    console.log('Now (UTC):', now.toISOString());
    console.log('Is endTime > Now?', latest ? latest.endTime > now : 'N/A');
    console.log('Is type GROUP?', latest?.type === 'GROUP');
    console.log('Is status SCHEDULED or LIVE?', ['SCHEDULED', 'LIVE'].includes(latest?.status || ''));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
