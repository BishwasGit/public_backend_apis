-- Create admin1 user
INSERT INTO "User" (id, alias, "hashedPin", role, email, "dateOfBirth", "hasAcceptedTerms", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin1',
  '$2b$10$UC8hqPOkS/2kFnI2JxI6VulSY6Xygyw5Og3sSTuPYajJCQxkVEiWC',
  'ADMIN',
  'admin@test.com',
  '1990-01-01',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (alias) DO NOTHING;

-- Create patient1 user
INSERT INTO "User" (id, alias, "hashedPin", role, email, "dateOfBirth", "hasAcceptedTerms", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'patient1',
  '$2b$10$UC8hqPOkS/2kFnI2JxI6VulSY6Xygyw5Og3sSTuPYajJCQxkVEiWC',
  'PATIENT',
  'patient1@test.com',
  '1995-05-15',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (alias) DO NOTHING;

-- Create psychologist1 user
INSERT INTO "User" (id, alias, "hashedPin", role, email, "dateOfBirth", "hasAcceptedTerms", "isVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'psychologist1',
  '$2b$10$UC8hqPOkS/2kFnI2JxI6VulSY6Xygyw5Og3sSTuPYajJCQxkVEiWC',
  'PSYCHOLOGIST',
  'psych1@test.com',
  '1985-03-20',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (alias) DO NOTHING;

-- Create wallets for all users
INSERT INTO "Wallet" (id, "userId", balance, "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 
  CASE 
    WHEN role = 'PATIENT' THEN 1000.0
    ELSE 0.0
  END,
  NOW(),
  NOW()
FROM "User"
WHERE alias IN ('admin1', 'patient1', 'psychologist1')
ON CONFLICT ("userId") DO NOTHING;
