import {
    Controller,
    Get,
    Put,
    Body,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/client';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    @Get('commission')
    @Roles(Role.ADMIN)
    async getCommission() {
        const percent = await this.settingsService.getCommissionPercent();
        return { commissionPercent: percent };
    }

    @Put('commission')
    @Roles(Role.ADMIN)
    async updateCommission(
        @Body() body: { commissionPercent: number },
        @Request() req,
    ) {
        const { commissionPercent } = body;

        if (
            typeof commissionPercent !== 'number' ||
            commissionPercent < 0 ||
            commissionPercent > 100
        ) {
            throw new BadRequestException(
                'Commission percent must be a number between 0 and 100',
            );
        }

        await this.settingsService.updateCommissionPercent(
            commissionPercent,
            req.user.userId,
        );

        return {
            success: true,
            message: 'Commission percentage updated successfully',
            commissionPercent,
        };
    }

    @Get()
    @Roles(Role.ADMIN)
    async getSettings() {
        return this.settingsService.getSettings();
    }
}
