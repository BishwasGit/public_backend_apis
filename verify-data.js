const { PrismaClient } = require('./generated/client');

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verifying Database Data\n');
  console.log('=' .repeat(60));

  try {
    // Count all records
    const userCount = await prisma.user.count();
    const walletCount = await prisma.wallet.count();
    const serviceOptionCount = await prisma.serviceOption.count();
    const mediaFolderCount = await prisma.mediaFolder.count();
    const mediaFileCount = await prisma.mediaFile.count();
    const sessionCount = await prisma.session.count();
    const transactionCount = await prisma.transaction.count();

    console.log('\n📊 Database Statistics:');
    console.log('─'.repeat(60));
    console.log(`👤 Users: ${userCount}`);
    console.log(`💰 Wallets: ${walletCount}`);
    console.log(`💼 Service Options: ${serviceOptionCount}`);
    console.log(`📁 Media Folders: ${mediaFolderCount}`);
    console.log(`📄 Media Files: ${mediaFileCount}`);
    console.log(`📅 Sessions: ${sessionCount}`);
    console.log(`💳 Transactions: ${transactionCount}`);

    // Breakdown by role
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const psychologistCount = await prisma.user.count({ where: { role: 'PSYCHOLOGIST' } });
    const patientCount = await prisma.user.count({ where: { role: 'PATIENT' } });
    const verifiedPsychCount = await prisma.user.count({ 
      where: { role: 'PSYCHOLOGIST', isVerified: true } 
    });

    console.log('\n👥 User Breakdown:');
    console.log('─'.repeat(60));
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Psychologists: ${psychologistCount} (${verifiedPsychCount} verified)`);
    console.log(`   Patients: ${patientCount}`);

    // Session breakdown
    const scheduledSessions = await prisma.session.count({ where: { status: 'SCHEDULED' } });
    const liveSessions = await prisma.session.count({ where: { status: 'LIVE' } });
    const completedSessions = await prisma.session.count({ where: { status: 'COMPLETED' } });
    const cancelledSessions = await prisma.session.count({ where: { status: 'CANCELLED' } });

    console.log('\n📅 Session Breakdown:');
    console.log('─'.repeat(60));
    console.log(`   Scheduled: ${scheduledSessions}`);
    console.log(`   Live: ${liveSessions}`);
    console.log(`   Completed: ${completedSessions}`);
    console.log(`   Cancelled: ${cancelledSessions}`);

    // Transaction breakdown
    const deposits = await prisma.transaction.count({ where: { type: 'DEPOSIT' } });
    const withdrawals = await prisma.transaction.count({ where: { type: 'WITHDRAWAL' } });
    const sessionPayments = await prisma.transaction.count({ where: { type: 'SESSION_PAYMENT' } });
    const refunds = await prisma.transaction.count({ where: { type: 'REFUND' } });

    console.log('\n💳 Transaction Breakdown:');
    console.log('─'.repeat(60));
    console.log(`   Deposits: ${deposits}`);
    console.log(`   Withdrawals: ${withdrawals}`);
    console.log(`   Session Payments: ${sessionPayments}`);
    console.log(`   Refunds: ${refunds}`);

    // Sample data
    console.log('\n📝 Sample Data:');
    console.log('─'.repeat(60));

    const sampleAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    console.log(`\n✅ Sample Admin: ${sampleAdmin.alias} (ID: ${sampleAdmin.id.substring(0, 8)}...)`);

    const samplePsych = await prisma.user.findFirst({ 
      where: { role: 'PSYCHOLOGIST', isVerified: true },
      include: { serviceOptions: true, mediaFolders: true }
    });
    console.log(`\n✅ Sample Verified Psychologist: ${samplePsych.alias}`);
    console.log(`   Bio: ${samplePsych.bio?.substring(0, 80)}...`);
    console.log(`   Specialties: ${JSON.stringify(samplePsych.specialties)}`);
    console.log(`   Hourly Rate: $${samplePsych.hourlyRate}`);
    console.log(`   Service Options: ${samplePsych.serviceOptions.length}`);
    console.log(`   Media Folders: ${samplePsych.mediaFolders.length}`);

    const samplePatient = await prisma.user.findFirst({ 
      where: { role: 'PATIENT' },
      include: { wallet: true }
    });
    console.log(`\n✅ Sample Patient: ${samplePatient.alias}`);
    console.log(`   Wallet Balance: $${samplePatient.wallet.balance}`);

    const sampleSession = await prisma.session.findFirst({
      where: { status: 'COMPLETED' },
      include: { psychologist: true, patient: true }
    });
    if (sampleSession) {
      console.log(`\n✅ Sample Completed Session:`);
      console.log(`   Psychologist: ${sampleSession.psychologist.alias}`);
      console.log(`   Patient: ${sampleSession.patient?.alias || 'Group Session'}`);
      console.log(`   Price: $${sampleSession.price}`);
      console.log(`   Duration: ${Math.round((new Date(sampleSession.endTime) - new Date(sampleSession.startTime)) / 60000)} minutes`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Data verification completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
