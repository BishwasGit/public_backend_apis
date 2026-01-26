import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BlockedPatientService } from './blocked-patient.service';

@ApiTags('blocked-patients')
@ApiBearerAuth()
@Controller('blocked-patients')
@UseGuards(JwtAuthGuard)
export class BlockedPatientController {
  constructor(private readonly blockedPatientService: BlockedPatientService) {}

  @Get()
  @ApiOperation({ summary: 'Get my blocked patients list' })
  getBlockedPatients(@Request() req) {
    return this.blockedPatientService.getBlockedPatients(req.user.id);
  }

  @Post(':patientId')
  @ApiOperation({ summary: 'Block a patient' })
  blockPatient(
    @Request() req,
    @Param('patientId') patientId: string,
    @Body() body: { reason?: string },
  ) {
    return this.blockedPatientService.blockPatient(
      req.user.id,
      patientId,
      body.reason,
    );
  }

  @Delete(':patientId')
  @ApiOperation({ summary: 'Unblock a patient' })
  unblockPatient(@Request() req, @Param('patientId') patientId: string) {
    return this.blockedPatientService.unblockPatient(req.user.id, patientId);
  }

  @Get('check/:patientId')
  @ApiOperation({ summary: 'Check if a patient is blocked' })
  checkBlocked(@Request() req, @Param('patientId') patientId: string) {
    return this.blockedPatientService.isPatientBlocked(req.user.id, patientId);
  }
}
