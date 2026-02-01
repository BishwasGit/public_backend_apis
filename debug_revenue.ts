
import { PrismaClient } from './generated/client';
import { AnalyticsService } from './src/analytics/analytics.service';
import { PrismaService } from './src/prisma/prisma.service';

const prisma = new PrismaClient();
// Mock PrismaService
const prismaService = prisma as unknown as PrismaService;
const analyticsService = new AnalyticsService(prismaService);

async function main() {
    console.log('Testing getRevenue...');
    try {
        const revenue = await analyticsService.getRevenue('month');
        console.log('Revenue (month):', JSON.stringify(revenue, null, 2));

        const revenueYear = await analyticsService.getRevenue('year');
        console.log('Revenue (year):', JSON.stringify(revenueYear, null, 2));

        // Check raw sessions
        const sessions = await prisma.session.findMany({
            where: { status: 'COMPLETED' },
            select: { id: true, price: true, createdAt: true }
        });
        console.log(`Found ${sessions.length} completed sessions.`);
        if (sessions.length > 0) {
            console.log('Sample session:', sessions[0]);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
