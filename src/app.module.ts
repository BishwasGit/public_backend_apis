import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import * as redisStore from 'cache-manager-ioredis';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { DisputesModule } from './disputes/disputes.module';
import { DemoMinutesModule } from './demo-minutes/demo-minutes.module';
import { BlockedPatientModule } from './blocked-patient/blocked-patient.module';
import { CalendarModule } from './calendar/calendar.module';
import { EncryptionService } from './common/encryption/encryption.service';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { MediaManagerModule } from './media-manager/media-manager.module';
import { MessagesModule } from './messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { ReportsModule } from './reports/reports.module';
import { ServiceOptionsModule } from './service-options/service-options.module';
import { SessionModule } from './session/session.module';
import { UsersModule } from './users/users.module';
import { VideoModule } from './video/video.module';
import { WalletModule } from './wallet/wallet.module';
import { WithdrawalModule } from './withdrawal/withdrawal.module';
import { SettingsModule } from './settings/settings.module';

import { NotificationsModule } from './notifications/notifications.module';

import { LanguageController } from './modules/i18n/language.controller';
import { TranslationController } from './modules/i18n/translation.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NotificationsModule,
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300, // 5 minutes default
    }),
    // Rate Limiting - 100 requests per minute per IP (generous for development)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    AuditModule, // Global audit logging
    UsersModule,
    AuthModule,
    DisputesModule,
    VideoModule,
    WalletModule,
    ProfileModule,
    SessionModule,
    ServiceOptionsModule,
    BlockedPatientModule,
    // MediaModule, // Removed to prevent route conflicts
    MediaManagerModule,
    AnalyticsModule,
    WithdrawalModule,
    ReportsModule,
    MessagesModule,
    CalendarModule,
    SettingsModule,
    DemoMinutesModule,
  ],
  controllers: [AppController, LanguageController, TranslationController],
  providers: [
    AppService,
    EncryptionService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule { }
