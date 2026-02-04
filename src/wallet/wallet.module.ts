import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { DemoMinutesModule } from '../demo-minutes/demo-minutes.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { EsewaService } from './esewa/esewa.service';
import { EsewaController } from './esewa/esewa.controller';

@Module({
  imports: [PrismaModule, SettingsModule, DemoMinutesModule],
  controllers: [WalletController, EsewaController],
  providers: [WalletService, EsewaService],
  exports: [WalletService],
})
export class WalletModule { }
