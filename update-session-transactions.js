const { PrismaClient } = require('./generated/client');

const prisma = new PrismaClient();

async function updateSeedWithTransactions() {
  console.log('📊 Adding session transactions for all sessions...\n');

  const sessions = await prisma.session.findMany({
    where: { patientId: { not: null } },
    include: {
      psychologist: { include: { wallet: true } },
      patient: { include: { wallet: true } }
    }
  });

  console.log(`Found ${sessions.length} sessions with patients\n`);

  let transactionsCreated = 0;

  for (const session of sessions) {
    try {
      // Check if transactions already exist for this session
      const existing = await prisma.transaction.findFirst({
        where: { referenceId: session.id }
      });

      if (existing) {
        console.log(`   ⏭️  Skipping session ${session.id.substring(0, 8)}... (transactions already exist)`);
        continue;
      }

      if (!session.patient?.wallet || !session.psychologist?.wallet) {
        console.log(`   ⚠️  Skipping session ${session.id.substring(0, 8)}... (missing wallet)`);
        continue;
      }

      // Only create transactions for COMPLETED and LIVE sessions
      if (session.status === 'COMPLETED' || session.status === 'LIVE') {
        // Patient transaction (SESSION_PAYMENT - negative)
        await prisma.transaction.create({
          data: {
            walletId: session.patient.wallet.id,
            amount: -session.price,
            type: 'SESSION_PAYMENT',
            status: 'COMPLETED',
            referenceId: session.id,
            description: `Session with ${session.psychologist.alias}`,
            createdAt: session.startTime
          }
        });

        // Psychologist transaction (SESSION_PAYMENT - positive, 85% after commission)
        const earning = session.price * 0.85;
        await prisma.transaction.create({
          data: {
            walletId: session.psychologist.wallet.id,
            amount: earning,
            type: 'SESSION_PAYMENT',
            status: 'COMPLETED',
            referenceId: session.id,
            description: `Session with ${session.patient.alias}`,
            createdAt: session.startTime
          }
        });

        transactionsCreated += 2;
        console.log(`   ✓ Created transactions for session ${session.id.substring(0, 8)}... ($${session.price})`);
      }

      // Create transactions for CANCELLED sessions (refunds)
      if (session.status === 'CANCELLED') {
        await prisma.transaction.create({
          data: {
            walletId: session.patient.wallet.id,
            amount: session.price,
            type: 'REFUND',
            status: 'COMPLETED',
            referenceId: session.id,
            description: `Refund for cancelled session with ${session.psychologist.alias}`,
            createdAt: session.updatedAt
          }
        });

        transactionsCreated += 1;
        console.log(`   ✓ Created refund for cancelled session ${session.id.substring(0, 8)}...`);
      }
    } catch (error) {
      console.error(`   ❌ Error processing session ${session.id.substring(0, 8)}:`, error.message);
    }
  }

  console.log(`\n✅ Created ${transactionsCreated} transactions for ${sessions.length} sessions`);
}

updateSeedWithTransactions()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
