
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Services ---');

    const psychologists = await prisma.user.findMany({
        where: { role: 'PSYCHOLOGIST' },
        include: {
            serviceOptions: true,
            _count: { select: { serviceOptions: true } }
        },
    });

    console.log(`Found ${psychologists.length} psychologists.`);

    for (const psych of psychologists) {
        console.log(`Psychologist: ${psych.alias} (${psych.id})`);
        console.log(`  - Service Count: ${psych._count.serviceOptions}`);
        if (psych.serviceOptions.length > 0) {
            console.log(`  - Sample Service: ${psych.serviceOptions[0].name} (ID: ${psych.serviceOptions[0].id})`);
        } else {
            console.log(`  - No services found.`);
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
