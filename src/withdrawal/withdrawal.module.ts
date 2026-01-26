import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WithdrawalController } from './withdrawal.controller';
import { WithdrawalService } from './withdrawal.service';

@Module({
    imports: [PrismaModule, EmailModule],
    controllers: [WithdrawalController],
    providers: [WithdrawalService],
    exports: [WithdrawalService],
})
export class WithdrawalModule { }
