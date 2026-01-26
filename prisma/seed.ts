import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with test users...');

    const hashedPin = await bcrypt.hash('1234', 10);

    // Test users with hardcoded credentials
    const testUsers = [
        {
            alias: 'admin1',
            hashedPin,
            role: 'ADMIN',
            email: 'admin@test.com',
            dateOfBirth: new Date('1990-01-01'),
            hasAcceptedTerms: true,
        },
        {
            alias: 'patient1',
            hashedPin,
            role: 'PATIENT',
            email: 'patient1@test.com',
            dateOfBirth: new Date('1995-05-15'),
            hasAcceptedTerms: true,
            gender: 'MALE',
        },
        {
            alias: 'psychologist1',
            hashedPin,
            role: 'PSYCHOLOGIST',
            email: 'psych1@test.com',
            dateOfBirth: new Date('1985-03-20'),
            hasAcceptedTerms: true,
            isVerified: true,
            gender: 'FEMALE',
            specialties: ['Anxiety', 'Depression', 'Stress Management'],
            languages: ['English', 'Nepali'],
            bio: 'Experienced psychologist specializing in anxiety and depression treatment.',
        },
    ];

    for (const userData of testUsers) {
        try {
            // Check if user already exists
            const existing = await prisma.user.findUnique({
                where: { alias: userData.alias },
            });

            if (existing) {
                console.log(`✓ User ${userData.alias} already exists`);
                continue;
            }

            // Create user
            const user = await prisma.user.create({
                data: userData as any,
            });

            // Create wallet for user
            await prisma.wallet.create({
                data: {
                    userId: user.id,
                    balance: userData.role === 'PATIENT' ? 1000 : 0, // Give patients 1000 for testing
                },
            });

            console.log(`✓ Created user: ${userData.alias} (${userData.role})`);
        } catch (error) {
            console.error(`✗ Failed to create user ${userData.alias}:`, error.message);
        }
    }

    console.log('\n✅ Seeding completed!');
    console.log('\nTest Credentials:');
    console.log('  admin1 / 1234');
    console.log('  patient1 / 1234');
    console.log('  psychologist1 / 1234');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
