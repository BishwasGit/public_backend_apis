import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WithdrawalService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    async createRequest(userId: string, amount: number, payoutMethodId: string) {
        // Validate amount
        if (amount <= 0) {
            throw new BadRequestException('Amount must be greater than 0');
        }

        // Get user with wallet
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // STRICT VALIDATION: User can only withdraw available balance or less
        if (!user.wallet || user.wallet.balance < amount) {
            throw new BadRequestException(
                `Insufficient balance. Available: $${user.wallet?.balance || 0}, Requested: $${amount}`
            );
        }

        // Get payout method details
        const payoutMethod = await this.prisma.payoutMethod.findUnique({
            where: { id: payoutMethodId },
        });

        if (!payoutMethod || payoutMethod.userId !== userId) {
            throw new BadRequestException('Invalid payout method provided');
        }

        // Create withdrawal request
        const request = await this.prisma.withdrawalRequest.create({
            data: {
                userId,
                amount,
                status: 'PENDING',
                paymentStatus: 'PENDING',
                payoutDetails: {
                    type: payoutMethod.type,
                    details: payoutMethod.details,
                }, // Store snapshot
            },
            include: {
                user: {
                    select: {
                        id: true,
                        alias: true,
                        role: true,
                        email: true,
                    },
                },
            },
        });

        // Send email notification to admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@platform.com';
        await this.emailService.sendWithdrawalRequestNotification(
            adminEmail,
            user.alias,
            amount,
            request.id,
        );

        return request;
    }

    async getMyRequests(userId: string) {
        return this.prisma.withdrawalRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                reviewer: {
                    select: {
                        alias: true,
                    },
                },
            },
        });
    }

    async getAllRequests(status?: string) {
        const where = status ? { status: status as any } : {};

        return this.prisma.withdrawalRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        alias: true,
                        role: true,
                        email: true,
                    },
                },
                reviewer: {
                    select: {
                        alias: true,
                    },
                },
            },
        });
    }

    async approveRequest(id: string, adminId: string) {
        const request = await this.prisma.withdrawalRequest.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!request) {
            throw new NotFoundException('Withdrawal request not found');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestException('Request already processed');
        }

        // Check wallet balance again (strict validation)
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: request.userId },
        });

        if (!wallet || wallet.balance < request.amount) {
            throw new BadRequestException(
                `Insufficient balance. Available: $${wallet?.balance || 0}, Required: $${request.amount}`
            );
        }

        // Create transaction and update wallet in a transaction
        const updatedRequest = await this.prisma.$transaction(async (tx) => {
            // Create withdrawal transaction
            const transaction = await tx.transaction.create({
                data: {
                    walletId: wallet.id,
                    amount: -request.amount,
                    type: 'WITHDRAWAL',
                    status: 'COMPLETED',
                    description: `Withdrawal request #${id}`,
                },
            });

            // Update wallet balance
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: {
                        decrement: request.amount,
                    },
                },
            });

            // Update withdrawal request - status APPROVED, payment PROCESSING
            return await tx.withdrawalRequest.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    paymentStatus: 'PROCESSING',
                    reviewedAt: new Date(),
                    reviewedBy: adminId,
                    transactionId: transaction.id,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            alias: true,
                            role: true,
                            email: true,
                        },
                    },
                    reviewer: {
                        select: {
                            alias: true,
                        },
                    },
                },
            });
        });

        // Send email notification to user
        if (request.user.email) {
            await this.emailService.sendWithdrawalApprovedNotification(
                request.user.email,
                request.user.alias,
                request.amount,
            );
        }

        return updatedRequest;
    }

    async rejectRequest(id: string, adminId: string, reason: string) {
        const request = await this.prisma.withdrawalRequest.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!request) {
            throw new NotFoundException('Withdrawal request not found');
        }

        if (request.status !== 'PENDING') {
            throw new BadRequestException('Request already processed');
        }

        const updatedRequest = await this.prisma.withdrawalRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                paymentStatus: 'FAILED',
                reviewedAt: new Date(),
                reviewedBy: adminId,
                rejectionReason: reason,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        alias: true,
                        role: true,
                        email: true,
                    },
                },
                reviewer: {
                    select: {
                        alias: true,
                    },
                },
            },
        });

        // Send email notification to user
        if (request.user.email) {
            await this.emailService.sendWithdrawalRejectedNotification(
                request.user.email,
                request.user.alias,
                request.amount,
                reason,
            );
        }

        return updatedRequest;
    }

    async completePayment(id: string, adminId: string, paymentProof: string) {
        const request = await this.prisma.withdrawalRequest.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!request) {
            throw new NotFoundException('Withdrawal request not found');
        }

        if (request.status !== 'APPROVED') {
            throw new BadRequestException('Request must be approved first');
        }

        if (request.paymentStatus === 'COMPLETED') {
            throw new BadRequestException('Payment already completed');
        }

        const updatedRequest = await this.prisma.withdrawalRequest.update({
            where: { id },
            data: {
                status: 'COMPLETED', // Update main status too
                paymentStatus: 'COMPLETED',
                paymentProof,
                paymentCompletedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        alias: true,
                        role: true,
                        email: true,
                    },
                },
            },
        });

        // Send email notification to user
        if (request.user.email) {
            await this.emailService.sendPaymentCompletedNotification(
                request.user.email,
                request.user.alias,
                request.amount,
            );
        }

        return updatedRequest;
    }

    async getPendingCount() {
        return this.prisma.withdrawalRequest.count({
            where: { status: 'PENDING' },
        });
    }

    // Payout Methods
    async getPayoutMethods(userId: string) {
        return this.prisma.payoutMethod.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addPayoutMethod(userId: string, type: any, details: any, isDefault: boolean) {
        if (isDefault) {
            // Unset existing default
            await this.prisma.payoutMethod.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        return this.prisma.payoutMethod.create({
            data: {
                userId,
                type,
                details,
                isDefault,
            },
        });
    }

    async deletePayoutMethod(userId: string, id: string) {
        // Validate ownership
        const method = await this.prisma.payoutMethod.findUnique({
            where: { id },
        });

        if (!method || method.userId !== userId) {
            throw new NotFoundException('Payout method not found');
        }

        return this.prisma.payoutMethod.delete({
            where: { id },
        });
    }
}
