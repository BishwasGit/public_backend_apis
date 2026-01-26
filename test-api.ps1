# Test login after creating a user via signup

Write-Host "Testing API endpoints..." -ForegroundColor Cyan

# Create a test user via signup
Write-Host "`n1. Creating test user via signup..." -ForegroundColor Yellow
$signupBody = @{
    alias = "testuser1"
    pin = "1234"
    role = "ADMIN"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
    Write-Host "✅ User created successfully!" -ForegroundColor Green
    Write-Host ($signupResponse | ConvertTo-Json -Depth 3)
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️  User already exists, proceeding with login..." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message
    }
}

# Test login
Write-Host "`n2. Testing login..." -ForegroundColor Yellow
$loginBody = @{
    alias = "testuser1"
    pin = "1234"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Access Token: $($loginResponse.access_token.Substring(0, 20))..." -ForegroundColor Cyan
    Write-Host "User: $($loginResponse.user.alias) ($($loginResponse.user.role))" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}

# Test root endpoint
Write-Host "`n3. Testing root endpoint..." -ForegroundColor Yellow
try {
    $rootResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/" -Method GET
    Write-Host "✅ Root endpoint response: $rootResponse" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ API Tests Complete!" -ForegroundColor Green
