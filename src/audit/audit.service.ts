import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditAction {
    CREATE = 'CREATE',
    READ = 'READ',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    VERIFY = 'VERIFY',
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    REFUND = 'REFUND',
    SETTLE = 'SETTLE',
    UPLOAD = 'UPLOAD',
    DOWNLOAD = 'DOWNLOAD',
}

export enum AuditEntity {
    USER = 'USER',
    SESSION = 'SESSION',
    TRANSACTION = 'TRANSACTION',
    WALLET = 'WALLET',
    SERVICE_OPTION = 'SERVICE_OPTION',
    DISPUTE = 'DISPUTE',
    MEDIA_FOLDER = 'MEDIA_FOLDER',
    MEDIA_FILE = 'MEDIA_FILE',
    PROFILE = 'PROFILE',
}

interface LogParams {
    userId?: string;
    action: AuditAction;
    entity: AuditEntity;
    entityId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
}

interface GetAuditLogsFilters {
    userId?: string;
    entity?: AuditEntity;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
}

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    /**
     * Log an audit event
     * DRY Principle: Single method for all audit logging
     */
    async log(params: LogParams) {
        try {
            return await this.prisma.auditLog.create({
                data: {
                    userId: params.userId,
                    action: params.action,
                    entity: params.entity,
                    entityId: params.entityId,
                    changes: params.changes || null,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                },
            });
        } catch (error) {
            // Log error but don't throw - audit logging should never break the app
            console.error('Audit logging failed:', error);
            return null;
        }
    }

    /**
     * Get audit logs with filtering
     * DRY Principle: Reusable filtering logic
     */
    async getAuditLogs(filters: GetAuditLogsFilters = {}) {
        const where: any = {};

        if (filters.userId) where.userId = filters.userId;
        if (filters.entity) where.entity = filters.entity;
        if (filters.entityId) where.entityId = filters.entityId;

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            alias: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: filters.limit || 100,
                skip: filters.skip || 0,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data: logs,
            total,
            limit: filters.limit || 100,
            skip: filters.skip || 0,
        };
    }

    /**
     * Get audit logs for a specific user
     */
    async getUserAuditLogs(userId: string, limit = 100) {
        return this.getAuditLogs({ userId, limit });
    }

    /**
     * Get audit logs for a specific entity
     */
    async getEntityAuditLogs(entity: AuditEntity, entityId: string, limit = 100) {
        return this.getAuditLogs({ entity, entityId, limit });
    }
}
