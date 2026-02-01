
const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

async function main() {
  const request = await prisma.withdrawalRequest.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  console.log('Latest Withdrawal Request:');
  console.log(JSON.stringify(request, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
