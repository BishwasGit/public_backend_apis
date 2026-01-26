import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditEntity, AuditService } from './audit.service';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Get()
    async getAuditLogs(@Query() query: GetAuditLogsDto) {
        const filters = {
            ...query,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        };
        return this.auditService.getAuditLogs(filters);
    }

    @Get('user/:userId')
    async getUserAuditLogs(
        @Param('userId') userId: string,
        @Query('limit') limit?: number,
    ) {
        return this.auditService.getUserAuditLogs(userId, limit);
    }

    @Get('entity/:entity/:entityId')
    async getEntityAuditLogs(
        @Param('entity') entity: AuditEntity,
        @Param('entityId') entityId: string,
        @Query('limit') limit?: number,
    ) {
        return this.auditService.getEntityAuditLogs(entity, entityId, limit);
    }
}
