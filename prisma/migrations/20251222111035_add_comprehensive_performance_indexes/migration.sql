-- CreateIndex
CREATE INDEX "MediaFolder_psychologistId_idx" ON "MediaFolder"("psychologistId");

-- CreateIndex
CREATE INDEX "MediaFolder_createdAt_idx" ON "MediaFolder"("createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Message_receiverId_isRead_idx" ON "Message"("receiverId", "isRead");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceOption_userId_isEnabled_idx" ON "ServiceOption"("userId", "isEnabled");

-- CreateIndex
CREATE INDEX "ServiceOption_type_idx" ON "ServiceOption"("type");

-- CreateIndex
CREATE INDEX "Session_psychologistId_status_idx" ON "Session"("psychologistId", "status");

-- CreateIndex
CREATE INDEX "Session_patientId_status_idx" ON "Session"("patientId", "status");

-- CreateIndex
CREATE INDEX "Session_status_startTime_idx" ON "Session"("status", "startTime");

-- CreateIndex
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_walletId_createdAt_idx" ON "Transaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_status_idx" ON "Transaction"("type", "status");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isVerified_idx" ON "User"("isVerified");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_isProfileVisible_isVerified_idx" ON "User"("isProfileVisible", "isVerified");

-- CreateIndex
CREATE INDEX "reviews_psychologistId_isHidden_idx" ON "reviews"("psychologistId", "isHidden");

-- CreateIndex
CREATE INDEX "reviews_sessionId_idx" ON "reviews"("sessionId");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "reviews"("createdAt");
