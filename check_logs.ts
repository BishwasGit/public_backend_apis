
import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.auditLog.count();
        console.log(`Total Audit Logs: ${count}`);

        if (count > 0) {
            const logs = await prisma.auditLog.findMany({ take: 5 });
            console.log('Sample logs:', JSON.stringify(logs, null, 2));
        } else {
            console.log('No logs found. Creating a test log...');
            await prisma.auditLog.create({
                data: {
                    action: 'READ',
                    entity: 'USER',
                    entityId: 'system-test-id',
                    // details removed, using changes instead
                    changes: { note: 'Test log created via script' },
                    ipAddress: '127.0.0.1',
                    userAgent: 'DebugScript'
                }
            });
            console.log('Test log created.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
