import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockedPatientController } from './blocked-patient.controller';
import { BlockedPatientService } from './blocked-patient.service';

@Module({
  imports: [PrismaModule],
  controllers: [BlockedPatientController],
  providers: [BlockedPatientService],
  exports: [BlockedPatientService],
})
export class BlockedPatientModule {}
