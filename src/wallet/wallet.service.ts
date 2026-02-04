import { BadRequestException, Injectable } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) { }

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      // Auto-create wallet if missing (simplification for MVP)
      return this.prisma.wallet.create({
        data: { userId },
      });
    }
    return wallet;
  }

  async deposit(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const wallet = await this.getBalance(userId);

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

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

  async reserve(userId: string, amount: number) {
    // Logic to hold funds for a session
    // For MVP, we might simply deduct or check balance
    const wallet = await this.getBalance(userId);
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: TransactionType.SESSION_RESERVE,
          status: TransactionStatus.COMPLETED,
        },
      });
      return updatedWallet;
    });
  }

  async processPayment(payerId: string, receiverId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      // Get dynamic commission percentage
      const commissionPercent = await this.settingsService.getCommissionPercent();
      const platformFee = (amount * commissionPercent) / 100;
      const providerEarnings = amount - platformFee;

      // 1. Deduct from Payer (Patient)
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
          status: TransactionStatus.COMPLETED, // Debited
        },
      });

      // 2. Credit Provider (Psychologist)
      // Ensure Provider Wallet Exists
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
          type: TransactionType.DEPOSIT, // Earnings
          status: TransactionStatus.COMPLETED,
          referenceId: `Platform Service Fee deducted: ${platformFee}`,
        },
      });

      // 3. Platform Ledger (Optional: Create a special wallet or just log)
      // For now, implicit via the differential.

      return { success: true, providerEarnings, platformFee };
    });
  }

  async withdraw(userId: string, amount: number, details: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: TransactionType.WITHDRAWAL, // Need to add this enum if missing
          status: TransactionStatus.PENDING,
          referenceId: details, // e.g., "eSewa: 9841..."
        },
      });

      return updatedWallet;
    });
  }

  async getTransactions(userId: string) {
    const wallet = await this.getBalance(userId);
    return this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }
  async refund(userId: string, amount: number, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');

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
    });
  }

  async completePayment(payerId: string, receiverId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      // Get dynamic commission percentage
      const commissionPercent = await this.settingsService.getCommissionPercent();
      const platformFee = (amount * commissionPercent) / 100;
      const providerEarnings = amount - platformFee;

      // Funds were already reserved (deducted) from Payer.
      // We just need to credit the Provider.

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
          referenceId: `Session Earnings (Fee: ${platformFee})`,
        },
      });

      return { success: true, providerEarnings };
    });
  }
}
