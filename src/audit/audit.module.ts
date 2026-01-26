import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';

/**
 * Global Audit Module
 * DRY Principle: Centralized audit logging available throughout the app
 */
@Global()
@Module({
    imports: [PrismaModule],
    controllers: [AuditController],
    providers: [
        AuditService,
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditInterceptor,
        },
    ],
    exports: [AuditService],
})
export class AuditModule { }
