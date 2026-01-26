const axios = require('axios');
const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

async function testSessionCreation() {
  try {
    // 1. Get Psychologist
    const psych = await prisma.user.findFirst({ where: { role: 'PSYCHOLOGIST' } });
    if (!psych) throw new Error('No psychologist found');
    console.log('Psychologist found:', psych.alias);

    // 2. Mock API call (using prisma directly to simulate success, or we should use actual HTTP if server is running)
    // Looking at backend main.ts, port is likely 3000.
    // We need a token. Let's just create directly via Prisma to match what controller does.
    // Controller calls sessionService.createSession

    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 24); // Tomorrow
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const session = await prisma.session.create({
      data: {
        psychologistId: psych.id,
        startTime: startTime,
        endTime: endTime,
        price: 150,
        type: 'ONE_ON_ONE',
        status: 'SCHEDULED',
      },
    });

    console.log('✅ Session created successfully:', session.id);
    console.log('Start Time:', session.startTime);

    // 3. Verify it shows up in "Available Sessions" query
    const available = await prisma.session.findMany({
        where: {
            psychologistId: psych.id,
            status: 'SCHEDULED',
            patientId: null
        }
    });

    console.log('Available sessions found:', available.length);
    if (available.length > 0) {
        console.log('✅ Created session is listed as available.');
    } else {
        console.error('❌ Created session NOT found in available list.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionCreation();
