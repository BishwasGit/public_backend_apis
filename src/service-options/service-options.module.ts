import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ServiceOptionsController } from './service-options.controller';
import { ServiceOptionsService } from './service-options.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceOptionsController],
  providers: [ServiceOptionsService],
  exports: [ServiceOptionsService],
})
export class ServiceOptionsModule {}
