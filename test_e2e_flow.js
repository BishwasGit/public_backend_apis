const axios = require('axios');
const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

// Mock service logic interaction since we can't easily run NestJS app context here
async function testEndToEndFlow() {
  try {
    console.log('🔄 Starting End-to-End Simulation');

    // 1. Get Users
    const psych = await prisma.user.findFirst({ where: { role: 'PSYCHOLOGIST' } });
    const patient = await prisma.user.findFirst({ where: { role: 'PATIENT' } });
    
    if (!psych || !patient) throw new Error('Missing users');

    // 2. Simulate CREATE SESSION (Mocking the Service Fix)
    // In the real app, the service now defaults price.
    // Let's simulate what the service receives (no price) and what it does.
    const inputData = {
        startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endTime: new Date(Date.now() + 86400000 + 3600000).toISOString()
    };
    
    // Simulate Service Logic: Defaulting Price
    const priceToUse = inputData.price || psych.hourlyRate || 50;
    
    console.log(`Creating session for ${psych.alias} with price: ${priceToUse}`);

    const session = await prisma.session.create({
      data: {
        psychologistId: psych.id,
        startTime: inputData.startTime,
        endTime: inputData.endTime,
        price: priceToUse,
        type: 'ONE_ON_ONE',
        status: 'SCHEDULED',
      },
    });
    console.log('✅ Session Created:', session.id);

    // 3. Simulate PATIENT BOOKING
    console.log(`Booking as ${patient.alias}...`);
    
    // Check wallet
    let wallet = await prisma.wallet.findUnique({ where: { userId: patient.id } });
    console.log('Initial Balance:', wallet.balance);

    if (wallet.balance < session.price) {
        console.log('⚠️ Insufficient balance, adding funds...');
        wallet = await prisma.wallet.update({
            where: { userId: patient.id },
            data: { balance: { increment: 1000 } }
        });
    }

    // Book logic (Service: bookSession)
    // Reserve funds
    await prisma.wallet.update({
        where: { userId: patient.id },
        data: { balance: { decrement: session.price } }
    });
    
    // Update session
    const bookedSession = await prisma.session.update({
        where: { id: session.id },
        data: {
            patientId: patient.id,
            status: 'SCHEDULED'
        }
    });

    console.log('✅ Session Booked by:', bookedSession.patientId);
    
    const finalWallet = await prisma.wallet.findUnique({ where: { userId: patient.id } });
    console.log('Final Balance:', finalWallet.balance);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEndToEndFlow();
