
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const alias = 'admin';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { alias: alias },
            update: {
                hashedPin: hashedPassword,
                role: 'ADMIN',
                isVerified: true
            },
            create: {
                alias: alias,
                role: 'ADMIN',
                hashedPin: hashedPassword,
                isVerified: true,
                // Fill other required fields with defaults if necessary based on schema
                // Schema says: 
                // demoMinutes Int @default(0)
                // isProfileVisible Boolean @default(false)
                // isOnline Boolean @default(false)
                // All others seem optional or have defaults
            },
        });
        console.log('Admin user created/updated successfully.');
        console.log('Alias:', alias);
        console.log('Password:', password);
    } catch (e) {
        console.error('Error creating admin:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
