import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup of dummy data...');

    try {
        // Delete users with @test.com email
        // Note: CASCADING deletes should handle related records (Wallet, Sessions, etc.)
        // if configured in schema. If not, we might need to delete those first.
        // Assuming typical Prisma cascade or just trying to delete user first.
        
        const { count } = await prisma.user.deleteMany({
            where: {
                email: {
                    endsWith: '@test.com',
                },
            },
        });

        console.log(`✅ Deleted ${count} dummy users (and their related data if cascaded).`);
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
