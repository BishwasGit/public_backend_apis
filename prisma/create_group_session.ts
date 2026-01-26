import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Find a psychologist
    const psychologist = await prisma.user.findFirst({
        where: { role: 'PSYCHOLOGIST' },
    });

    if (!psychologist) {
        console.error('No psychologist found');
        return;
    }

    console.log(`Found psychologist: ${psychologist.alias}`);

    // 2. Create a future group session
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 24); // Tomorrow
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const session = await prisma.session.create({
        data: {
            psychologistId: psychologist.id,
            startTime,
            endTime,
            price: 50,
            type: 'GROUP' as any,
            status: 'SCHEDULED' as any,
            title: 'Test Group Session for Anxiety',
            maxParticipants: 10,
        },
    });

    console.log(`Created Group Session: ${session.title} (ID: ${session.id})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
