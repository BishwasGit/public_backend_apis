const { PrismaClient } = require('./generated/client');

const prisma = new PrismaClient();

async function addSessionData() {
  const userId = '20049436-7a04-4fe4-8326-224ad06ea5d7';
  
  console.log('🔍 Checking user...');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true }
  });

  if (!user) {
    console.error('❌ User not found with ID:', userId);
    return;
  }

  console.log(`✅ Found user: ${user.alias} (${user.role})`);
  console.log(`   Wallet Balance: $${user.wallet?.balance || 0}`);

  // Get psychologists and patients for session creation
  const psychologists = await prisma.user.findMany({
    where: { role: 'PSYCHOLOGIST', isVerified: true },
    take: 2
  });

  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    take: 2
  });

  if (psychologists.length === 0 || patients.length === 0) {
    console.error('❌ Not enough users to create sessions');
    return;
  }

  console.log('\\n📅 Creating sessions...');
  const now = new Date();
  const sessions = [];

  // Create 3 completed sessions
  for (let i = 0; i < 3; i++) {
    const startTime = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000); // i+1 days ago
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const isPatient = user.role === 'PATIENT';
    const session = await prisma.session.create({
      data: {
        psychologistId: isPatient ? psychologists[i % 2].id : user.id,
        patientId: isPatient ? user.id : patients[i % 2].id,
        startTime,
        endTime,
        status: 'COMPLETED',
        type: 'ONE_ON_ONE',
        price: 100 + (i * 25),
        updatedAt: startTime
      },
      include: {
        psychologist: { select: { alias: true } },
        patient: { select: { alias: true } }
      }
    });
    sessions.push(session);
    console.log(`   ✓ Created session ${i + 1}: ${session.psychologist.alias} → ${session.patient.alias} ($${session.price})`);
  }

  console.log('\\n💰 Creating transactions...');
  
  for (const session of sessions) {
    const isPatient = user.role === 'PATIENT';
    const userWallet = user.wallet;

    if (isPatient) {
      // Patient: SESSION_RESERVE transaction (negative amount)
      const tx = await prisma.transaction.create({
        data: {
          walletId: userWallet.id,
          amount: -session.price,
          type: 'SESSION_PAYMENT',
          status: 'COMPLETED',
          referenceId: session.id,
          description: `Payment for therapy session with ${session.psychologist.alias}`,
          createdAt: session.startTime
        }
      });
      console.log(`   ✓ Created transaction: SESSION_PAYMENT -$${session.price} (Ref: ${session.id.substring(0, 8)}...)`);
    } else {
      // Psychologist: SESSION_PAYMENT transaction (positive amount)
      const earning = session.price * 0.85; // 85% after platform fee
      const tx = await prisma.transaction.create({
        data: {
          walletId: userWallet.id,
          amount: earning,
          type: 'SESSION_PAYMENT',
          status: 'COMPLETED',
          referenceId: session.id,
          description: `Earning from therapy session with ${session.patient.alias}`,
          createdAt: session.startTime
        }
      });
      console.log(`   ✓ Created transaction: SESSION_PAYMENT +$${earning.toFixed(2)} (Ref: ${session.id.substring(0, 8)}...)`);
    }
  }

  console.log('\\n✅ Session data added successfully!');
  console.log(`\\n🔗 View transaction history at:`);
  console.log(`   http://localhost:5173/transaction-history/${userId}`);
}

addSessionData()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
