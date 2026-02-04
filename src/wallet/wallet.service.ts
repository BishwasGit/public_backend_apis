import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { DemoMinutesService } from '../demo-minutes/demo-minutes.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private demoMinutesService: DemoMinutesService,
  ) { }

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    });

    return wallet?.balance ?? 0;
  }

  async topUp(userId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      // Find or create wallet
      let wallet = await tx.wallet.findUnique({ where: { userId } });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId },
        });
      }

      // Update balance
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
        },
      });

      return updatedWallet;
    });
  }

  /**
   * Process session payment with demo minutes applied
   * @param patientId - Patient paying
   * @param psychologistId - Psychologist receiving
   * @param sessionMinutes - Total session duration in minutes
   * @param perMinuteRate - Rate per minute (if null, uses psychologist's hourly rate)
   */
  async processSessionPayment(
    patientId: string,
    psychologistId: string,
    sessionMinutes: number,
    perMinuteRate?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Calculate billing with demo minutes
      const billing = await this.demoMinutesService.calculateBillingWithDemo(
        patientId,
        psychologistId,
        sessionMinutes,
      );

      // 2. Get psychologist rate if not provided
      let rate = perMinuteRate;
      if (!rate) {
        const psychologist = await tx.user.findUnique({
          where: { id: psychologistId },
          select: { hourlyRate: true },
        });
        rate = (psychologist?.hourlyRate || 0) / 60; // Convert hourly to per-minute
      }

      // 3. Calculate charges
      const grossAmount = billing.chargeableMinutes * rate;
      const commissionPercent =
        await this.settingsService.getCommissionPercent();
      const platformFee = (grossAmount * commissionPercent) / 100;
      const psychologistEarnings = grossAmount - platformFee;

      // 4. Charge patient wallet (only for chargeable minutes)
      if (billing.chargeableMinutes > 0) {
        const patientWallet = await tx.wallet.findUnique({
          where: { userId: patientId },
        });

        if (!patientWallet || patientWallet.balance < grossAmount) {
          throw new BadRequestException('Insufficient funds');
        }

        await tx.wallet.update({
          where: { userId: patientId },
          data: { balance: { decrement: grossAmount } },
        });

        await tx.transaction.create({
          data: {
            walletId: patientWallet.id,
            amount: grossAmount,
            type: TransactionType.SESSION_PAYMENT,
            status: TransactionStatus.COMPLETED,
            referenceId: `Session: ${billing.totalMinutes}min (${billing.demoUsed}min free, ${billing.chargeableMinutes}min paid)`,
          },
        });
      }

      // 5. Credit psychologist (only if earnings > 0)
      if (psychologistEarnings > 0) {
        let psychologistWallet = await tx.wallet.findUnique({
          where: { userId: psychologistId },
        });

        if (!psychologistWallet) {
          psychologistWallet = await tx.wallet.create({
            data: { userId: psychologistId },
          });
        }

        await tx.wallet.update({
          where: { userId: psychologistId },
          data: { balance: { increment: psychologistEarnings } },
        });

        await tx.transaction.create({
          data: {
            walletId: psychologistWallet.id,
            amount: psychologistEarnings,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.COMPLETED,
            referenceId: `Session earnings (Platform fee: $${platformFee.toFixed(2)})`,
          },
        });
      }

      return {
        success: true,
        billing,
        grossAmount,
        platformFee,
        psychologistEarnings,
        rate,
      };
    });
  }

  // Keep old processPayment for backward compatibility
  async processPayment(payerId: string, receiverId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      const commissionPercent =
        await this.settingsService.getCommissionPercent();
      const platformFee = (amount * commissionPercent) / 100;
      const providerEarnings = amount - platformFee;

      const payerWallet = await tx.wallet.findUnique({
        where: { userId: payerId },
      });
      if (!payerWallet || payerWallet.balance < amount) {
        throw new BadRequestException('Insufficient funds');
      }
      await tx.wallet.update({
        where: { userId: payerId },
        data: { balance: { decrement: amount } },
      });
      await tx.transaction.create({
        data: {
          walletId: payerWallet.id,
          amount: amount,
          type: TransactionType.SESSION_PAYMENT,
          status: TransactionStatus.COMPLETED,
        },
      });

      let providerWallet = await tx.wallet.findUnique({
        where: { userId: receiverId },
      });
      if (!providerWallet) {
        providerWallet = await tx.wallet.create({
          data: { userId: receiverId },
        });
      }

      await tx.wallet.update({
        where: { userId: receiverId },
        data: { balance: { increment: providerEarnings } },
      });
      await tx.transaction.create({
        data: {
          walletId: providerWallet.id,
          amount: providerEarnings,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          referenceId: `Platform Service Fee deducted: ${platformFee}`,
        },
      });

      return { success: true, providerEarnings, platformFee };
    });
  }

  async withdraw(userId: string, amount: number, details: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.PENDING,
          referenceId: details,
        },
      });

      return { success: true };
    });
  }



  async completePayment(
    sessionId: string,
    patientId: string,
    psychologistId: string,
  ) {
    // Get session rate and calculate actual duration from session data
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { price: true, startTime: true, endTime: true },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    // Calculate actual duration in minutes
    const actualDuration =
      (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60;
    const perMinuteRate = session.price / 60; // Convert hourly to per-minute

    // Use new session payment method with demo minutes
    return this.processSessionPayment(
      patientId,
      psychologistId,
      actualDuration,
      perMinuteRate,
    );
  }

  // Alias for topUp - for backward compatibility
  async deposit(userId: string, amount: number) {
    return this.topUp(userId, amount);
  }

  // Reserve funds (for backward compatibility - just returns balance check)
  async reserve(userId: string, amount: number) {
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      throw new BadRequestException('Insufficient funds');
    }
    return { success: true, reserved: amount };
  }

  // Get transactions (for backward compatibility)
  async getTransactions(userId: string, referenceId?: string) {
    return this.prisma.transaction.findMany({
      where: {
        wallet: { userId },
        ...(referenceId ? { referenceId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Refund method
  async refund(userId: string, amount: number, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId },
        });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: TransactionType.REFUND,
          status: TransactionStatus.COMPLETED,
          referenceId: reason,
        },
      });

      return { success: true };
    });
  }
}
