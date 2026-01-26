const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

async function verify() {
  const users = await prisma.user.findMany({
    include: { wallet: true }
  });
  console.log('Users found:', users.length);
  users.forEach(u => {
    console.log(`- ${u.alias} (${u.role}): $${u.wallet?.balance}`);
  });
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
