const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const hashedPin = await bcrypt.hash('1234', 10);
    
    // Check if admin1 exists
    const existing = await prisma.user.findUnique({
      where: { alias: 'admin1' }
    });
    
    if (existing) {
      console.log('✅ admin1 already exists');
      console.log('ID:', existing.id);
      console.log('Alias:', existing.alias);
      console.log('Role:', existing.role);
      return;
    }
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        alias: 'admin1',
        hashedPin,
        role: 'ADMIN',
        email: 'admin@test.com',
        dateOfBirth: new Date('1990-01-01'),
        hasAcceptedTerms: true,
      }
    });
    
    // Create wallet for admin
    await prisma.wallet.create({
      data: {
        userId: admin.id,
        balance: 0,
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Alias: admin1');
    console.log('PIN: 1234');
    console.log('Role:', admin.role);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
