-- CreateIndex
CREATE INDEX "calendar_events_creatorId_startTime_idx" ON "calendar_events"("creatorId", "startTime");

-- CreateIndex
CREATE INDEX "calendar_events_startTime_endTime_idx" ON "calendar_events"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "calendar_events_type_idx" ON "calendar_events"("type");

-- CreateIndex
CREATE INDEX "calendar_events_sessionId_idx" ON "calendar_events"("sessionId");
