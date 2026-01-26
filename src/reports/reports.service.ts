import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get wallet ledger report for a user
     * Shows: deposits, withdrawals, payments, balance
     */
    async getWalletLedger(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                alias: true,
                role: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                },
            },
        });

        if (!wallet) {
            return {
                user,
                wallet: {
                    balance: 0,
                    totalDeposits: 0,
                    totalWithdrawals: 0,
                    totalEarnings: 0,
                    totalSpent: 0,
                },
                transactions: [],
                summary: {
                    depositsCount: 0,
                    withdrawalsCount: 0,
                    sessionsCount: 0,
                },
            };
        }

        // Calculate totals
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let totalEarnings = 0;
        let totalSpent = 0;
        let depositsCount = 0;
        let withdrawalsCount = 0;
        let sessionsCount = 0;

        const transactions = wallet.transactions.map((tx, index) => {
            // Calculate running balance
            const previousBalance = index === wallet.transactions.length - 1
                ? wallet.balance - tx.amount
                : wallet.transactions[index + 1] ? wallet.transactions[index + 1].amount : 0;

            // Update totals
            if (tx.type === 'DEPOSIT') {
                totalDeposits += tx.amount;
                depositsCount++;
            } else if (tx.type === 'WITHDRAWAL') {
                totalWithdrawals += Math.abs(tx.amount);
                withdrawalsCount++;
            } else if (tx.type === 'SESSION_PAYMENT') {
                if (user.role === 'PSYCHOLOGIST') {
                    totalEarnings += tx.amount;
                } else {
                    totalSpent += Math.abs(tx.amount);
                }
                sessionsCount++;
            } else if (tx.type === 'SESSION_RESERVE') {
                totalSpent += Math.abs(tx.amount);
                sessionsCount++;
            }

            return {
                id: tx.id,
                type: tx.type,
                amount: tx.amount,
                balance: previousBalance + tx.amount,
                description: tx.description || this.getTransactionDescription(tx.type),
                status: tx.status,
                createdAt: tx.createdAt,
            };
        });

        return {
            user,
            wallet: {
                balance: wallet.balance,
                totalDeposits,
                totalWithdrawals,
                totalEarnings,
                totalSpent,
            },
            transactions,
            summary: {
                depositsCount,
                withdrawalsCount,
                sessionsCount,
            },
        };
    }

    /**
     * Get all payables (amounts owed to psychologists)
     */
    async getPayables() {
        const psychologists = await this.prisma.user.findMany({
            where: {
                role: 'PSYCHOLOGIST',
                deletedAt: null,
            },
            include: {
                wallet: true,
                withdrawalRequests: {
                    where: {
                        status: 'PENDING',
                    },
                },
            },
        });

        const payablesList = psychologists.map(psych => {
            const pendingWithdrawals = psych.withdrawalRequests.reduce(
                (sum, req) => sum + req.amount,
                0
            );

            return {
                id: psych.id,
                alias: psych.alias,
                balance: psych.wallet?.balance || 0,
                pendingWithdrawals,
                totalPayable: (psych.wallet?.balance || 0) + pendingWithdrawals,
            };
        });

        const totalPayable = payablesList.reduce((sum, p) => sum + p.totalPayable, 0);

        return {
            totalPayable,
            psychologists: payablesList.sort((a, b) => b.totalPayable - a.totalPayable),
        };
    }

    /**
     * Get ledger balances for all users (both psychologists and patients)
     */
    async getLedgerBalances() {
        const [psychologists, patients] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    role: 'PSYCHOLOGIST',
                    deletedAt: null,
                },
                include: {
                    wallet: true,
                    withdrawalRequests: {
                        where: { status: 'PENDING' },
                    },
                },
            }),
            this.prisma.user.findMany({
                where: {
                    role: 'PATIENT',
                    deletedAt: null,
                },
                include: {
                    wallet: true,
                },
            }),
        ]);

        const psychologistsList = psychologists.map(p => ({
            id: p.id,
            alias: p.alias,
            balance: p.wallet?.balance || 0,
            pendingWithdrawals: p.withdrawalRequests.reduce((sum, req) => sum + req.amount, 0),
        }));

        const patientsList = patients.map(p => ({
            id: p.id,
            alias: p.alias,
            balance: p.wallet?.balance || 0,
        }));

        const psychologistsTotalBalance = psychologistsList.reduce((sum, p) => sum + p.balance, 0);
        const patientsTotalBalance = patientsList.reduce((sum, p) => sum + p.balance, 0);

        return {
            totalBalance: psychologistsTotalBalance + patientsTotalBalance,
            psychologists: {
                count: psychologistsList.length,
                totalBalance: psychologistsTotalBalance,
                users: psychologistsList.sort((a, b) => b.balance - a.balance),
            },
            patients: {
                count: patientsList.length,
                totalBalance: patientsTotalBalance,
                users: patientsList.sort((a, b) => b.balance - a.balance),
            },
        };
    }

    private getTransactionDescription(type: string): string {
        const descriptions = {
            DEPOSIT: 'Wallet deposit',
            WITHDRAWAL: 'Withdrawal',
            SESSION_RESERVE: 'Session reservation',
            SESSION_PAYMENT: 'Session payment',
            REFUND: 'Refund',
        };
        return descriptions[type] || 'Transaction';
    }
}
