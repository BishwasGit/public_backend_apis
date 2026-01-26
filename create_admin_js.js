
const { PrismaClient } = require('./generated/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const alias = 'admin';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { alias: alias },
      update: {
        hashedPin: hashedPassword,
        role: 'ADMIN',
        isVerified: true
      },
      create: {
        alias: alias,
        role: 'ADMIN',
        hashedPin: hashedPassword,
        isVerified: true
      },
    });
    console.log('SUCCESS: Admin user created/updated.');
    console.log('Alias: ' + alias);
    console.log('Password: ' + password);
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
