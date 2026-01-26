const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
    // Delete existing users with these aliases (and cascade wallets etc)
    await prisma.user.deleteMany({
      where: {
        alias: { in: ['admin1', 'psychologist1', 'patient1'] }
      }
    });
  // Create Admin
  const admin = await prisma.user.create({
    data: {
      alias: 'admin1',
      role: 'ADMIN',
      hashedPin: await bcrypt.hash('1234', 10), // Replace with a real hash in production
      isVerified: true,
      wallet: {
        create: { balance: 1000 }
      }
    },
    include: { wallet: true }
  });

  // Create Psychologist
  const psychologist = await prisma.user.create({
    data: {
      alias: 'psychologist1',
      role: 'PSYCHOLOGIST',
      hashedPin: await bcrypt.hash('1234', 10), // Replace with a real hash in production
      isVerified: true,
      bio: 'Experienced psychologist.',
      wallet: {
        create: { balance: 1000 }
      }
    },
    include: { wallet: true }
  });

  // Create Patient
  const patient = await prisma.user.create({
    data: {
      alias: 'patient1',
      role: 'PATIENT',
      hashedPin: await bcrypt.hash('1234', 10), // Replace with a real hash in production
      isVerified: true,
      wallet: {
        create: { balance: 1000 }
      }
    },
    include: { wallet: true }
  });

  console.log('Seeded users:', { admin, psychologist, patient });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
