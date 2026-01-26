# Quick setup script to initialize the database with test users

Write-Host "🔧 Setting up database..." -ForegroundColor Cyan

# Navigate to backend directory
$backendPath = "c:\laragon\www\xyz-app\backend"
Set-Location $backendPath

# Run Prisma migrations
Write-Host "`n📊 Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migrations may already be applied or database is already set up." -ForegroundColor Gray
}

# Generate Prisma Client (kill any processes first)
Write-Host "`n🔄 Generating Prisma Client..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.Path -like "*prisma*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
npx prisma generate --schema=./prisma/schema.prisma

# Seed the database
Write-Host "`n🌱 Seeding database with test users..." -ForegroundColor Yellow
node seed.js

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📝 Test Credentials:" -ForegroundColor Cyan
Write-Host "Admin: alias=admin1, pin=1234" -ForegroundColor White
Write-Host "Patient: alias=patient1, pin=1234" -ForegroundColor White
Write-Host "Psychologist: alias=psych1, pin=1234" -ForegroundColor White
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor Cyan
Write-Host "Root: http://localhost:3000/v1/" -ForegroundColor White
Write-Host "Login: POST http://localhost:3000/v1/auth/login" -ForegroundColor White  
Write-Host "Signup: POST http://localhost:3000/v1/auth/signup" -ForegroundColor White
Write-Host "Docs: http://localhost:3000/api/docs" -ForegroundColor White
