const { PrismaClient } = require('./generated/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing database...');
  // Delete in order to respect foreign key constraints
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.withdrawalRequest.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.mediaUnlock.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.mediaFolder.deleteMany();
  await prisma.session.deleteMany();
  await prisma.serviceOption.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('✅ Database cleared.');

  console.log('🌱 Seeding specific users...');

  // 1. Admin
  const adminPin = await bcrypt.hash('1234', 10);
  const admin = await prisma.user.create({
    data: {
      alias: 'admin',
      role: 'ADMIN',
      email: 'admin@example.com',
      hashedPin: adminPin,
      dateOfBirth: new Date('1990-01-01'),
      isVerified: true,
      hasAcceptedTerms: true,
    },
  });
  await prisma.wallet.create({ data: { userId: admin.id, balance: 0 } });
  console.log('✅ Created Admin: admin / 1234');

  // 2. Psychologist
  const psychPin = await bcrypt.hash('1234', 10);
  const psych = await prisma.user.create({
    data: {
      alias: 'psychologist',
      role: 'PSYCHOLOGIST',
      email: 'psych@example.com',
      hashedPin: psychPin,
      dateOfBirth: new Date('1985-05-05'),
      isVerified: true,
      hasAcceptedTerms: true,
      specialties: ['Anxiety', 'Depression'],
      hourlyRate: 100,
      bio: 'Experienced clinical psychologist.',
      isProfileVisible: true,
    },
  });
  await prisma.wallet.create({ data: { userId: psych.id, balance: 0 } });
  
  // Create default media folder for psych
  await prisma.mediaFolder.create({
      data: { name: 'My Gallery', psychologistId: psych.id }
  });

  // Create service options
  await prisma.serviceOption.create({
      data: {
          userId: psych.id,
          name: 'Video Session',
          price: 100,
          type: 'VIDEO',
          billingType: 'PER_SESSION',
          isEnabled: true
      }
  });

  console.log('✅ Created Psychologist: psychologist / 1234');

  // 3. Patient
  const patientPin = await bcrypt.hash('1234', 10);
  const patient = await prisma.user.create({
    data: {
      alias: 'patient',
      role: 'PATIENT',
      email: 'patient@example.com',
      hashedPin: patientPin,
      dateOfBirth: new Date('1995-10-10'),
      isVerified: true,
      hasAcceptedTerms: true,
    },
  });
  
  // Patient Wallet with $1000
  await prisma.wallet.create({ data: { userId: patient.id, balance: 1000 } });
  
  // Deposit transaction record
  await prisma.transaction.create({
    data: {
      wallet: { connect: { userId: patient.id } },
      amount: 1000,
      type: 'DEPOSIT',
      status: 'COMPLETED',
      description: 'Initial seed deposit',
    },
  });

  console.log('✅ Created Patient: patient / 1234 (Balance: $1000)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
