const { PrismaClient } = require('./generated/client');
const prisma = new PrismaClient();

async function check() {
  const session = await prisma.session.findUnique({
    where: { id: '209cc486-21ac-441f-b860-af1f51d4d749' },
    include: {
      psychologist: { select: { alias: true } },
      patient: { select: { alias: true } },
      participants: { select: { alias: true, id: true } }
    }
  });
  
  if (!session) {
    console.log('❌ Session not found');
  } else {
    console.log('Session Details:');
    console.log('  ID:', session.id);
    console.log('  Type:', session.type);
    console.log('  Status:', session.status);
    console.log('  Psychologist:', session.psychologist.alias);
    console.log('  Patient:', session.patient?.alias || 'None');
    console.log('  Participants:', session.participants.length);
    session.participants.forEach(p => {
      console.log('    -', p.alias, '(' + p.id + ')');
    });
    console.log('  Start Time:', session.startTime);
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
