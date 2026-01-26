
const { PrismaClient } = require('./generated/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      alias: 'email_user',
      role: 'PATIENT',
      pin: 'password123',
      email: 'test@example.com',
      isEmailVerified: true
    },
    {
      alias: 'phone_user',
      role: 'PATIENT',
      pin: 'password123',
      phoneNumber: '1234567890',
      isPhoneVerified: true
    },
    {
      alias: 'unverified_user',
      role: 'PATIENT',
      pin: 'password123',
      email: 'unverified@example.com',
      isEmailVerified: false
    }
  ];

  for (const u of users) {
    const hashedPin = await bcrypt.hash(u.pin, 10);
    try {
        // We use alias as unique key for upsert
      await prisma.user.upsert({
        where: { alias: u.alias },
        update: {
          hashedPin: hashedPin,
          role: u.role,
          email: u.email,
          phoneNumber: u.phoneNumber,
          isEmailVerified: u.isEmailVerified,
          isPhoneVerified: u.isPhoneVerified
        },
        create: {
          alias: u.alias,
          role: u.role,
          hashedPin: hashedPin,
          email: u.email,
          phoneNumber: u.phoneNumber,
          isEmailVerified: u.isEmailVerified ?? false,
          isPhoneVerified: u.isPhoneVerified ?? false
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
