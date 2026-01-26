const { PrismaClient } = require('./generated/client');

const prisma = new PrismaClient();

async function addFunds() {
  try {
    console.log('💰 Adding Funds to Patient1 Wallet\n');
    console.log('═'.repeat(50));

    // Find patient1
    const patient = await prisma.user.findFirst({
      where: {
        alias: 'patient1',
        role: 'PATIENT'
      }
    });

    if (!patient) {
      console.error('❌ Patient1 not found!');
      process.exit(1);
    }

    console.log(`✅ Found user: ${patient.alias} (${patient.id})`);

    // Check current wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: patient.id }
    });

    if (!wallet) {
      console.log('📝 No wallet found, creating one...');
      wallet = await prisma.wallet.create({
        data: {
          userId: patient.id,
          balance: 0
        }
      });
    }

    console.log(`💵 Current balance: $${wallet.balance}`);

    // Amount to add (change this as needed)
    const amountToAdd = 500;

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId: patient.id },
      data: {
        balance: {
          increment: amountToAdd
        }
      }
    });

    console.log(`➕ Added: $${amountToAdd}`);
    console.log(`✅ New balance: $${updatedWallet.balance}`);

    // Create a transaction record for tracking
    try {
      await prisma.transaction.create({
        data: {
          userId: patient.id,
          type: 'DEPOSIT',
          amount: amountToAdd,
          status: 'COMPLETED',
          description: 'Test fund addition'
        }
      });
      console.log('📝 Transaction record created');
    } catch (e) {
      console.log('⚠️  Transaction record not created (table may not exist)');
    }

    console.log('═'.repeat(50));
    console.log('\n✅ Done! Patient1 now has $' + updatedWallet.balance);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addFunds();
