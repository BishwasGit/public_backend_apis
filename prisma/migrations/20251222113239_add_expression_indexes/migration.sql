-- Create case-insensitive expression indexes for email and alias to improve login performance
CREATE INDEX IF NOT EXISTS "User_email_lower_idx" ON "User" (LOWER("email"));
CREATE INDEX IF NOT EXISTS "User_alias_lower_idx" ON "User" (LOWER("alias"));