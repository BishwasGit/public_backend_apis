
const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { alias: 'admin' },
    select: { alias: true, role: true }
  });
  console.log('Admin Role Check:', JSON.stringify(admin, null, 2));
  await prisma.$disconnect();
}

main();
