import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [WalletModule, PrismaModule, CalendarModule, NotificationsModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule { }
