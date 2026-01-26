import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hashedPin = await bcrypt.hash('password123', 10);

    const psychologists = [
        {
            alias: 'Dr. Smith',
            role: 'PSYCHOLOGIST',
            gender: 'Male',
            sexualOrientation: 'Straight',
            dateOfBirth: new Date('1980-01-01'), // 45 years old
            specialties: ['Anxiety', 'Depression'],
            hashedPin
        },
        {
            alias: 'Dr. Jones',
            role: 'PSYCHOLOGIST',
            gender: 'Female',
            sexualOrientation: 'Lesbian',
            dateOfBirth: new Date('1990-05-15'), // 35 years old
            specialties: ['Trauma', 'LGBTQ+'],
            hashedPin
        },
        {
            alias: 'Dr. Emily',
            role: 'PSYCHOLOGIST',
            gender: 'Female',
            sexualOrientation: 'Straight',
            dateOfBirth: new Date('1995-12-10'), // 30 years old
            specialties: ['Youth', 'Stress'],
            hashedPin
        }
    ];

    for (const psych of psychologists) {
        try {
            await prisma.user.upsert({
                where: { alias: psych.alias },
                update: {},
                create: {
                    ...psych,
                    role: 'PSYCHOLOGIST' // Ensure enum match
                }
            });
            console.log(`Seeded: ${psych.alias}`);
        } catch (e) {
            console.error(`Error seeding ${psych.alias}:`, e);
        }
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
