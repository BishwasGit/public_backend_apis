import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DemoMinutesService } from './demo-minutes.service';

@Controller('demo-minutes')
@UseGuards(JwtAuthGuard)
export class DemoMinutesController {
    constructor(private readonly demoMinutesService: DemoMinutesService) { }

    @Get('psychologist/:psychologistId')
    async getDemoInfo(
        @Request() req,
        @Param('psychologistId') psychologistId: string,
    ) {
        const remaining = await this.demoMinutesService.getRemainingDemo(
            req.user.id,
            psychologistId,
        );
        return { remaining };
    }

    @Get('my-usage')
    async getMyUsage(@Request() req) {
        return this.demoMinutesService.getPatientDemoHistory(req.user.id);
    }

    @Get('psychologist-stats')
    async getPsychologistStats(@Request() req) {
        return this.demoMinutesService.getPsychologistDemoStats(req.user.id);
    }
}
