// seed.js - comprehensive dummy data for all modules
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Connect client
  await prisma.$connect();

  // ---------- Users ----------
  const users = [
    // Admins
    { alias: 'admin1', role: 'ADMIN', email: 'admin1@example.com', dateOfBirth: new Date('1990-01-01'), pin: '1234', isVerified: false },
    { alias: 'admin2', role: 'ADMIN', email: 'admin2@example.com', dateOfBirth: new Date('1991-02-02'), pin: '1234', isVerified: false },
    // Patients (balance 1000)
    { alias: 'patient1', role: 'PATIENT', email: 'patient1@example.com', dateOfBirth: new Date('1995-05-15'), pin: '1234', isVerified: false },
    { alias: 'patient2', role: 'PATIENT', email: 'patient2@example.com', dateOfBirth: new Date('1996-06-16'), pin: '1234', isVerified: false },
    { alias: 'patient3', role: 'PATIENT', email: 'patient3@example.com', dateOfBirth: new Date('1997-07-20'), pin: '1234', isVerified: false },
    { alias: 'patient4', role: 'PATIENT', email: 'patient4@example.com', dateOfBirth: new Date('1998-08-25'), pin: '1234', isVerified: false },
    // Psychologists (verified)
    { alias: 'psych1', role: 'PSYCHOLOGIST', email: 'psych1@example.com', dateOfBirth: new Date('1988-03-22'), pin: '1234', isVerified: true },
    { alias: 'psych2', role: 'PSYCHOLOGIST', email: 'psych2@example.com', dateOfBirth: new Date('1989-04-10'), pin: '1234', isVerified: true },
    { alias: 'psych3', role: 'PSYCHOLOGIST', email: 'psych3@example.com', dateOfBirth: new Date('1990-05-05'), pin: '1234', isVerified: true },
    // Extra users for variety
    { alias: 'user5', role: 'PATIENT', email: 'user5@example.com', dateOfBirth: new Date('1999-09-09'), pin: '1234', isVerified: false },
    { alias: 'user6', role: 'PSYCHOLOGIST', email: 'user6@example.com', dateOfBirth: new Date('1992-10-12'), pin: '1234', isVerified: true },
    { alias: 'user7', role: 'ADMIN', email: 'user7@example.com', dateOfBirth: new Date('1993-11-13'), pin: '1234', isVerified: false },
    { alias: 'user8', role: 'PATIENT', email: 'user8@example.com', dateOfBirth: new Date('2000-12-01'), pin: '1234', isVerified: false },
    { alias: 'user9', role: 'PSYCHOLOGIST', email: 'user9@example.com', dateOfBirth: new Date('1994-01-15'), pin: '1234', isVerified: true },
    { alias: 'user10', role: 'PATIENT', email: 'user10@example.com', dateOfBirth: new Date('2001-02-20'), pin: '1234', isVerified: false },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { alias: u.alias } });
    if (existing) {
      console.log(`✅ ${u.alias} already exists`);
      continue;
    }
    const hashedPin = await bcrypt.hash(u.pin, 10);
    const user = await prisma.user.create({
      data: {
        alias: u.alias,
        hashedPin,
        role: u.role,
        email: u.email,
        dateOfBirth: u.dateOfBirth,
        hasAcceptedTerms: true,
        isVerified: u.isVerified,
      },
    });
    // Wallet: patients get 1000, others 0
    const balance = u.role === 'PATIENT' ? 1000 : 0;
    await prisma.wallet.create({ data: { userId: user.id, balance } });
    console.log(`✅ Created ${u.role.toLowerCase()} ${u.alias} (balance ${balance})`);

    // For patients, create an initial deposit transaction
    if (u.role === 'PATIENT') {
      await prisma.transaction.create({
        data: {
          wallet: { connect: { userId: user.id } },
          amount: 500,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          description: 'Seed deposit',
        },
      });
    }

    // For psychologists, create a media folder and a sample file
    if (u.role === 'PSYCHOLOGIST') {
      const folder = await prisma.mediaFolder.create({
        data: { name: `${u.alias}_media`, psychologistId: user.id },
      });
      await prisma.mediaFile.create({
        data: { filename: 'sample.jpg', type: 'IMAGE', folderId: folder.id },
      });
    }
  }

  // ---------- Withdrawal Requests (for a few patients) ----------
  const patientSubset = await prisma.user.findMany({ where: { role: 'PATIENT' }, take: 5 });
  for (const p of patientSubset) {
    await prisma.withdrawalRequest.create({
      data: {
        userId: p.id,
        amount: 100,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        requestedAt: new Date(),
      },
    });
    console.log(`🔔 Created withdrawal request for ${p.alias}`);
  }

  // ---------- Service Options (for psychologists) ----------
  const psychSubset = await prisma.user.findMany({ where: { role: 'PSYCHOLOGIST' }, take: 5 });
  for (const phy of psychSubset) {
    await prisma.serviceOption.create({
      data: {
        userId: phy.id,
        name: 'Standard Session',
        price: 50,
        type: 'ONE_ON_ONE',
        billingType: 'PER_SESSION',
        isEnabled: true,
      },
    });
    console.log(`⚙️ Added service option for ${phy.alias}`);
  }

  // ---------- Sessions (pair psychologists with patients) ----------
  for (let i = 0; i < Math.min(patientSubset.length, psychSubset.length); i++) {
    const patient = patientSubset[i];
    const psychologist = psychSubset[i];
    await prisma.session.create({
      data: {
        patientId: patient.id,
        psychologistId: psychologist.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
        status: 'SCHEDULED',
        type: 'ONE_ON_ONE',
        price: 50,
      },
    });
    console.log(`📅 Created session between ${patient.alias} and ${psychologist.alias}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
