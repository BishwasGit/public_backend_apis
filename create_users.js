
const { PrismaClient } = require('./generated/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      alias: 'patient',
      role: 'PATIENT',
      pin: 'password123'
    },
    {
      alias: 'psychologist',
      role: 'PSYCHOLOGIST',
      pin: 'password123'
    }
  ];

  for (const u of users) {
    const hashedPin = await bcrypt.hash(u.pin, 10);
    try {
      await prisma.user.upsert({
        where: { alias: u.alias },
        update: {
          hashedPin: hashedPin,
          role: u.role,
          isVerified: true
        },
        create: {
          alias: u.alias,
          role: u.role,
          hashedPin: hashedPin,
          isVerified: true
        },
      });
      console.log(`SUCCESS: User '${u.alias}' created/updated.`);
    } catch (e) {
      console.error(`ERROR creating ${u.alias}:`, e);
    }
  }
  await prisma.$disconnect();
}

main();
