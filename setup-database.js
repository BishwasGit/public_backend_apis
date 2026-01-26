const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env file to get DATABASE_URL
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);

if (!dbUrlMatch) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

const databaseUrl = dbUrlMatch[1].trim();
console.log('📊 Database URL found');

// Parse the DATABASE_URL
// Format: postgresql://user:password@host:port/database
const urlPattern = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
const match = databaseUrl.match(urlPattern);

if (!match) {
  console.error('❌ Invalid DATABASE_URL format');
  console.log('Expected format: postgresql://user:password@host:port/database');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

console.log(`\n🔍 Database Configuration:`);
console.log(`   User: ${user}`);
console.log(`   Host: ${host}`);
console.log(`   Port: ${port}`);
console.log(`   Database: ${database}`);

// Try to run Prisma db push
console.log('\n🚀 Attempting to push Prisma schema to database...\n');

try {
  execSync('npx prisma db push --force-reset --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('\n✅ Database schema pushed successfully!');
} catch (error) {
  console.error('\n❌ Failed to push schema. Error:', error.message);
  console.log('\n💡 Troubleshooting steps:');
  console.log('   1. Ensure PostgreSQL is running in Laragon');
  console.log('   2. Check if the database user has proper permissions');
  console.log('   3. Try creating the database manually in pgAdmin or Laragon');
  console.log(`   4. Run: CREATE DATABASE ${database};`);
  console.log(`   5. Run: GRANT ALL PRIVILEGES ON DATABASE ${database} TO ${user};`);
  process.exit(1);
}
