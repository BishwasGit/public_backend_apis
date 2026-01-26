const { PrismaClient } = require('./generated/client');

async function checkConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...\n');
    
    // Try to connect
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`\n📊 Found ${tables.length} tables in database:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    if (tables.length === 0) {
      console.log('\n⚠️  No tables found. Run: npx prisma db push');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n💡 Please check:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. DATABASE_URL in .env is correct');
    console.log('   3. Database exists and user has permissions');
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
