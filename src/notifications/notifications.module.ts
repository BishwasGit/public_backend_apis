import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduleService } from './notifications.schedule.service';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsScheduleService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
