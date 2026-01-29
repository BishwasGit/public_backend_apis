import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { EsewaService } from './esewa/esewa.service';
import { EsewaController } from './esewa/esewa.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WalletController, EsewaController],
  providers: [WalletService, EsewaService],
  exports: [WalletService],
})
export class WalletModule {}
