import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
    constructor(private reportsService: ReportsService) { }

    @Get('wallet-ledger/:userId')
    async getWalletLedger(@Param('userId') userId: string) {
        return this.reportsService.getWalletLedger(userId);
    }

    @Get('payables')
    async getPayables() {
        return this.reportsService.getPayables();
    }

    @Get('ledger-balances')
    async getLedgerBalances() {
        return this.reportsService.getLedgerBalances();
    }
}
