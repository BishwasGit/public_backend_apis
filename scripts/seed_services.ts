import { BillingType, PrismaClient, ServiceType } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding services for psychologists...');

    const psychologists = await prisma.user.findMany({
        where: { role: 'PSYCHOLOGIST' },
        include: { serviceOptions: true },
    });

    console.log(`Found ${psychologists.length} psychologists.`);

    for (const psych of psychologists) {
        if (psych.serviceOptions.length > 0) {
            console.log(`Psychologist ${psych.alias} (${psych.id}) already has services. Skipping.`);
            continue;
        }

        console.log(`Adding services for ${psych.alias} (${psych.id})...`);

        const services = [
            {
                name: 'Initial Consultation',
                description: 'A 30-minute introductory session to discuss your needs and how we can work together.',
                price: 30.00,
                duration: 30,
                type: ServiceType.VIDEO,
                billingType: BillingType.PER_SESSION,
                isEnabled: true,
                userId: psych.id,
            },
            {
                name: 'Standard Therapy Session',
                description: 'A standard 60-minute therapy session via video call.',
                price: 80.00,
                duration: 60,
                type: ServiceType.VIDEO,
                billingType: BillingType.PER_SESSION,
                isEnabled: true,
                userId: psych.id,
            },
            {
                name: 'Chat Support Bundle',
                description: '7 days of asynchronous chat support.',
                price: 50.00,
                duration: null,
                type: ServiceType.CHAT,
                billingType: BillingType.BUNDLE_7_DAY,
                isEnabled: true,
                userId: psych.id,
            },
        ];

        for (const service of services) {
            await prisma.serviceOption.create({
                data: service,
            });
        }
    }

    console.log('Service seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
