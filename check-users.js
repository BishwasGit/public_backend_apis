const { PrismaClient } = require('./generated/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database connection...');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      alias: true,
      role: true,
      email: true,
      phoneNumber: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    }
  });

  console.log('\n📊 Total users in database:', users.length);
  
  if (users.length > 0) {
    console.log('\n👥 Users:');
    users.forEach(user => {
      console.log(`- ${user.alias} (${user.role})`);
      if (user.email) console.log(`  Email: ${user.email} (Verified: ${user.isEmailVerified})`);
      if (user.phoneNumber) console.log(`  Phone: ${user.phoneNumber} (Verified: ${user.isPhoneVerified})`);
    });
  } else {
    console.log('\n⚠️  No users found in the database!');
    console.log('You need to create users first. Run: npm run seed or node create_admin.ts');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
