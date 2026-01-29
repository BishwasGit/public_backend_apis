const { PrismaClient } = require('../generated/client');

const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Helper function to hash PIN
async function hashPin(pin) {
  return await bcrypt.hash(pin, 10);
}

// Helper to generate random date
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data
  // Clear existing data
  console.log('🧹 Clearing existing data...');
  
  // Independent tables (referencing User or others)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  
  // Events
  // Note: EventParticipants is a join table for many-to-many, usually named specific ways in Prisma but explicit here if model exists
  // The schema has `model EventParticipants`, so we use the model name on prisma client which is typically camelCase of model name
  await prisma.eventParticipants.deleteMany(); 
  await prisma.calendarEvent.deleteMany();

  // Financials & Requests
  await prisma.withdrawalRequest.deleteMany();
  await prisma.walletTopup.deleteMany();
  await prisma.payoutMethod.deleteMany();
  
  // Settings/Other
  await prisma.blockedPatient.deleteMany();

  // Media
  await prisma.mediaUnlock.deleteMany();
  
  // Core Logic Tables
  await prisma.transaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.serviceOption.deleteMany();
  await prisma.mediaFile.deleteMany();
  await prisma.mediaFolder.deleteMany();
  await prisma.wallet.deleteMany();
  
  // Finally User
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared\n');

  // ==================== USERS ====================
  console.log('👥 Creating users...');
  
  // Admin Users (3)
  const admins = [];
  for (let i = 1; i <= 3; i++) {
    const admin = await prisma.user.create({
      data: {
        alias: `admin${i}`,
        role: 'ADMIN',
        hashedPin: await hashPin('1234'),
        hasAcceptedTerms: true,
        wallet: {
          create: { balance: 0 }
        }
      }
    });
    admins.push(admin);
  }
  console.log(`   ✓ Created ${admins.length} admin users`);

  // Psychologist Users (10: 5 verified, 5 unverified)
  const psychologists = [];
  const specialtiesList = [
    ['Anxiety', 'Depression', 'Stress Management'],
    ['Trauma', 'PTSD', 'Grief Counseling'],
    ['Relationship Issues', 'Family Therapy', 'Couples Counseling'],
    ['Addiction', 'Substance Abuse', 'Recovery Support'],
    ['LGBTQ+ Support', 'Identity Issues', 'Coming Out'],
    ['Career Counseling', 'Work Stress', 'Burnout'],
    ['Eating Disorders', 'Body Image', 'Self-Esteem'],
    ['Sleep Disorders', 'Insomnia', 'Sleep Hygiene'],
    ['Anger Management', 'Emotional Regulation', 'Mindfulness'],
    ['Child Psychology', 'Adolescent Issues', 'Parenting Support']
  ];

  const languages = [
    ['English', 'Spanish'],
    ['English', 'French'],
    ['English', 'Mandarin'],
    ['English', 'Hindi'],
    ['English', 'Arabic'],
    ['English'],
    ['English', 'German'],
    ['English', 'Japanese'],
    ['English', 'Portuguese'],
    ['English', 'Russian']
  ];

  const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
  const orientations = ['Heterosexual', 'Homosexual', 'Bisexual', 'Pansexual', 'Asexual', 'Prefer not to say'];

  for (let i = 1; i <= 10; i++) {
    const isVerified = i <= 5;
    const psychologist = await prisma.user.create({
      data: {
        alias: `psychologist${i}`,
        role: 'PSYCHOLOGIST',
        hashedPin: await hashPin('1234'),
        isVerified: isVerified,
        bio: `Experienced psychologist specializing in ${specialtiesList[i-1][0]} and ${specialtiesList[i-1][1]}. I provide a safe, non-judgmental space for healing and growth. With over ${5 + i} years of experience, I'm here to support you on your mental health journey.`,
        specialties: specialtiesList[i-1],
        languages: languages[i-1],
        hourlyRate: 50 + (i * 10),
        demoMinutes: i <= 5 ? 15 : 0,
        isProfileVisible: isVerified,
        isOnline: i <= 3,
        gender: genders[i % genders.length],
        sexualOrientation: orientations[i % orientations.length],
        dateOfBirth: new Date(1980 + i, i % 12, i),
        hasAcceptedTerms: true,
        email: `psychologist${i}@example.com`,
        isEmailVerified: isVerified,
        wallet: {
          create: { balance: isVerified ? (i * 100) : 0 }
        }
      }
    });
    psychologists.push(psychologist);
  }
  console.log(`   ✓ Created ${psychologists.length} psychologist users (${psychologists.filter(p => p.isVerified).length} verified)`);

  // Patient Users (20)
  const patients = [];
  for (let i = 1; i <= 20; i++) {
    const balances = [0, 50, 100, 200, 500];
    const patient = await prisma.user.create({
      data: {
        alias: `patient${i}`,
        role: 'PATIENT',
        hashedPin: await hashPin('1234'),
        gender: genders[i % genders.length],
        sexualOrientation: orientations[i % orientations.length],
        dateOfBirth: new Date(1990 + (i % 10), i % 12, i % 28),
        hasAcceptedTerms: true,
        email: i <= 10 ? `patient${i}@example.com` : null,
        phoneNumber: i > 10 ? `+1555000${1000 + i}` : null,
        isEmailVerified: i <= 10,
        isPhoneVerified: i > 10,
        wallet: {
          create: { balance: balances[i % balances.length] }
        }
      }
    });
    patients.push(patient);
  }
  console.log(`   ✓ Created ${patients.length} patient users\n`);

  // ==================== SERVICE OPTIONS ====================
  console.log('💼 Creating service options...');
  const serviceOptions = [];
  const serviceTypes = ['VIDEO', 'AUDIO_ONLY', 'CHAT', 'GROUP'];
  const billingTypes = ['PER_SESSION', 'PER_MINUTE', 'BUNDLE_7_DAY'];

  for (const psychologist of psychologists.filter(p => p.isVerified)) {
    // Each verified psychologist gets 3-5 service options
    const numOptions = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numOptions; i++) {
      const serviceType = serviceTypes[i % serviceTypes.length];
      const billingType = billingTypes[i % billingTypes.length];
      
      const option = await prisma.serviceOption.create({
        data: {
          userId: psychologist.id,
          name: `${serviceType} Session - ${billingType.replace(/_/g, ' ')}`,
          description: `Professional ${serviceType.toLowerCase()} therapy session with flexible ${billingType.toLowerCase().replace(/_/g, ' ')} billing.`,
          price: billingType === 'BUNDLE_7_DAY' ? 350 : billingType === 'PER_MINUTE' ? 2.5 : 75,
          duration: billingType === 'PER_SESSION' ? 60 : billingType === 'BUNDLE_7_DAY' ? null : null,
          type: serviceType,
          billingType: billingType,
          isEnabled: Math.random() > 0.2 // 80% enabled
        }
      });
      serviceOptions.push(option);
    }
  }
  console.log(`   ✓ Created ${serviceOptions.length} service options\n`);

  // ==================== MEDIA FOLDERS & FILES ====================
  console.log('📁 Creating media folders and files...');
  const mediaFolders = [];
  const mediaFiles = [];

  for (const psychologist of psychologists.filter(p => p.isVerified)) {
    // Each verified psychologist gets 3-5 folders
    const folderNames = ['Profile Photos', 'Demo Videos', 'Credentials', 'Testimonials', 'Resources'];
    const numFolders = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numFolders; i++) {
      const folder = await prisma.mediaFolder.create({
        data: {
          name: folderNames[i],
          psychologistId: psychologist.id
        }
      });
      mediaFolders.push(folder);

      // Each folder gets 2-5 files
      const numFiles = 2 + Math.floor(Math.random() * 4);
      const mediaTypes = ['IMAGE', 'VIDEO'];
      
      for (let j = 0; j < numFiles; j++) {
        const mediaType = mediaTypes[j % 2];
        const file = await prisma.mediaFile.create({
          data: {
            filename: `${folder.name.toLowerCase().replace(/ /g, '_')}_${j + 1}.${mediaType === 'IMAGE' ? 'jpg' : 'mp4'}`,
            type: mediaType,
            folderId: folder.id
          }
        });
        mediaFiles.push(file);
      }
    }
  }
  console.log(`   ✓ Created ${mediaFolders.length} media folders`);
  console.log(`   ✓ Created ${mediaFiles.length} media files\n`);

  // ==================== SESSIONS ====================
  console.log('📅 Creating sessions...');
  const sessions = [];
  const sessionStatuses = ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'];
  const sessionTypes = ['ONE_ON_ONE', 'GROUP'];

  const now = new Date();
  const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  const verifiedPsychs = psychologists.filter(p => p.isVerified);
  for (let i = 0; i < 30; i++) {
    const psychologist = verifiedPsychs[i % verifiedPsychs.length];
    const patient = patients[i % patients.length];
    const status = sessionStatuses[i % sessionStatuses.length];
    const sessionType = sessionTypes[i % sessionTypes.length];
    
    let startTime, endTime;
    if (status === 'COMPLETED') {
      startTime = randomDate(pastDate, now);
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
    } else if (status === 'SCHEDULED') {
      startTime = randomDate(now, futureDate);
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    } else if (status === 'LIVE') {
      startTime = new Date(now.getTime() - 15 * 60 * 1000); // Started 15 mins ago
      endTime = new Date(now.getTime() + 45 * 60 * 1000); // Ends in 45 mins
    } else { // CANCELLED
      startTime = randomDate(pastDate, futureDate);
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    }

    const session = await prisma.session.create({
      data: {
        psychologistId: psychologist.id,
        patientId: sessionType === 'ONE_ON_ONE' ? patient.id : null,
        startTime,
        endTime,
        status,
        type: sessionType,
        price: 75 + (i * 5)
      }
    });
    sessions.push(session);
  }
  console.log(`   ✓ Created ${sessions.length} sessions\n`);

  // ==================== TRANSACTIONS ====================
  console.log('💰 Creating transactions...');
  const transactions = [];

  // Patient deposits
  for (const patient of patients) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: patient.id } });
    if (wallet && wallet.balance > 0) {
      const tx = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: wallet.balance,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          referenceId: `DEP-${Date.now()}-${patient.id.substring(0, 8)}`
        }
      });
      transactions.push(tx);
    }
  }

  // Session payments for completed sessions
  for (const session of sessions.filter(s => s.status === 'COMPLETED' && s.patientId)) {
    const patient = patients.find(p => p.id === session.patientId);
    if (patient) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: patient.id } });
      
      // Reserve transaction
      const reserveTx = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: -session.price,
          type: 'SESSION_RESERVE',
          status: 'COMPLETED',
          referenceId: session.id
        }
      });
      transactions.push(reserveTx);

      // Payment transaction
      const psychologist = psychologists.find(p => p.id === session.psychologistId);
      const psychWallet = await prisma.wallet.findUnique({ where: { userId: psychologist.id } });
      
      const paymentTx = await prisma.transaction.create({
        data: {
          walletId: psychWallet.id,
          amount: session.price * 0.85, // Platform takes 15% commission
          type: 'SESSION_PAYMENT',
          status: 'COMPLETED',
          referenceId: session.id
        }
      });
      transactions.push(paymentTx);
    }
  }

  // Psychologist withdrawals
  for (const psychologist of psychologists.filter(p => p.isVerified)) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: psychologist.id } });
    if (wallet && wallet.balance > 100) {
      const withdrawAmount = Math.floor(wallet.balance * 0.5);
      const tx = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: -withdrawAmount,
          type: 'WITHDRAWAL',
          status: Math.random() > 0.1 ? 'COMPLETED' : 'PENDING',
          referenceId: `WD-${Date.now()}-${psychologist.id.substring(0, 8)}`
        }
      });
      transactions.push(tx);
    }
  }

  // Some refunds
  const cancelledSessions = sessions.filter(s => s.status === 'CANCELLED' && s.patientId);
  for (let i = 0; i < Math.min(5, cancelledSessions.length); i++) {
    const cancelledSession = cancelledSessions[i];
    const patient = patients.find(p => p.id === cancelledSession.patientId);
    if (patient) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: patient.id } });
      
      const tx = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: cancelledSession.price,
          type: 'REFUND',
          status: 'COMPLETED',
          referenceId: cancelledSession.id
        }
      });
      transactions.push(tx);
    }
  }

  console.log(`   ✓ Created ${transactions.length} transactions\n`);

  // ==================== SUMMARY ====================
  console.log('📊 Seed Summary:');
  console.log('================');
  console.log(`👤 Users: ${admins.length + psychologists.length + patients.length}`);
  console.log(`   - Admins: ${admins.length}`);
  console.log(`   - Psychologists: ${psychologists.length} (${psychologists.filter(p => p.isVerified).length} verified)`);
  console.log(`   - Patients: ${patients.length}`);
  console.log(`💼 Service Options: ${serviceOptions.length}`);
  console.log(`📁 Media Folders: ${mediaFolders.length}`);
  console.log(`📄 Media Files: ${mediaFiles.length}`);
  console.log(`📅 Sessions: ${sessions.length}`);
  console.log(`   - Scheduled: ${sessions.filter(s => s.status === 'SCHEDULED').length}`);
  console.log(`   - Live: ${sessions.filter(s => s.status === 'LIVE').length}`);
  console.log(`   - Completed: ${sessions.filter(s => s.status === 'COMPLETED').length}`);
  console.log(`   - Cancelled: ${sessions.filter(s => s.status === 'CANCELLED').length}`);
  console.log(`💰 Transactions: ${transactions.length}`);
  console.log('================\n');

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin: alias="admin1", pin="1234"');
  console.log('   Psychologist (verified): alias="psychologist1", pin="1234"');
  console.log('   Patient: alias="patient1", pin="1234"');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
