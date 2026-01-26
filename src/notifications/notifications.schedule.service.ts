import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduleService {
  private readonly logger = new Logger(NotificationsScheduleService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Check for upcoming sessions every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkUpcomingSessions() {
    this.logger.debug('Checking for upcoming sessions...');
    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);
    const thirtyFiveMinutesLater = new Date(now.getTime() + 35 * 60 * 1000);

    // Find sessions starting in 30-35 minutes
    const upcomingSessions = await this.prisma.session.findMany({
      where: {
        startTime: {
          gte: thirtyMinutesLater,
          lt: thirtyFiveMinutesLater,
        },
        status: 'SCHEDULED',
      },
      include: {
        patient: true,
        psychologist: true,
      },
    });

    for (const session of upcomingSessions) {
      // Notify Patient
      if (session.patientId) {
        await this.notificationsService.create(
          session.patientId,
          'Upcoming Session Reminder',
          `You have a session with ${session.psychologist.alias} in 30 minutes.`,
          NotificationType.SYSTEM,
        );
      }

      // Notify Psychologist
      if (session.psychologistId) {
        await this.notificationsService.create(
          session.psychologistId,
          'Upcoming Session Reminder',
          `You have a session with ${session.patient?.alias || 'Patient'} in 30 minutes.`,
          NotificationType.SYSTEM,
        );
      }
    }
    
    if (upcomingSessions.length > 0) {
      this.logger.log(`Sent reminders for ${upcomingSessions.length} upcoming sessions.`);
    }
  }
}
