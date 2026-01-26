const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup of dummy data...');

    try {
        // Delete users with @test.com email
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
