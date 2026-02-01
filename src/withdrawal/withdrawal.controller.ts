import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditAction, AuditEntity } from '../audit/audit.service';
import { Audit } from '../audit/decorators/audit.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WithdrawalService } from './withdrawal.service';

@ApiTags('withdrawal-requests')
@ApiBearerAuth()
@Controller('withdrawal-requests')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
    constructor(private withdrawalService: WithdrawalService) { }

    @Post()
    @ApiOperation({ summary: 'Create a withdrawal request' })
    @ApiBody({ schema: { type: 'object', properties: { amount: { type: 'number', example: 100 }, payoutMethodId: { type: 'string', example: 'uuid' } } } })
    @Audit(AuditEntity.TRANSACTION, AuditAction.CREATE)
    async createRequest(@Request() req, @Body() body: { amount: number; payoutMethodId: string }) {
        return this.withdrawalService.createRequest(req.user.id, body.amount, body.payoutMethodId);
    }

    @Get('my')
    @ApiOperation({ summary: 'Get my withdrawal requests' })
    async getMyRequests(@Request() req) {
        return this.withdrawalService.getMyRequests(req.user.id);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get all withdrawal requests (Admin)' })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
    async getAllRequests(@Query('status') status?: string) {
        return this.withdrawalService.getAllRequests(status);
    }

    @Get('pending-count')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Get count of pending requests (Admin)' })
    async getPendingCount() {
        const count = await this.withdrawalService.getPendingCount();
        return { count };
    }

    @Patch(':id/approve')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @Audit(AuditEntity.TRANSACTION, AuditAction.APPROVE)
    @ApiOperation({ summary: 'Approve a withdrawal request (Admin)' })
    async approveRequest(@Param('id') id: string, @Request() req) {
        return this.withdrawalService.approveRequest(id, req.user.id);
    }

    @Patch(':id/reject')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @Audit(AuditEntity.TRANSACTION, AuditAction.REJECT)
    @ApiOperation({ summary: 'Reject a withdrawal request (Admin)' })
    @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Insufficient funds' } } } })
    async rejectRequest(
        @Param('id') id: string,
        @Request() req,
        @Body('reason') reason: string,
    ) {
        return this.withdrawalService.rejectRequest(id, req.user.id, reason);
    }

    @Patch(':id/complete-payment')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    @Audit(AuditEntity.TRANSACTION, AuditAction.APPROVE)
    @ApiOperation({ summary: 'Mark request as paid (Admin)' })
    @ApiBody({ schema: { type: 'object', properties: { paymentProof: { type: 'string', example: 'tx_123456' } } } })
    async completePayment(
        @Param('id') id: string,
        @Request() req,
        @Body('paymentProof') paymentProof: string,
    ) {
        return this.withdrawalService.completePayment(id, req.user.id, paymentProof);
    }

}
