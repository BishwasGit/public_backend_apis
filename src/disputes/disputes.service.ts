
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DisputeStatus, Role, TransactionType } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { DisputeResolutionAction, ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Injectable()
export class DisputesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createDisputeDto: CreateDisputeDto) {
        const { sessionId, reason, description } = createDisputeDto;

        // 1. Verify session exists and user is a participant
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { patient: true, psychologist: true }
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.patientId !== userId && session.psychologistId !== userId) {
            throw new ForbiddenException('You can only dispute sessions you participated in');
        }

        // 2. Check if dispute already exists
        const existing = await this.prisma.dispute.findFirst({
            where: { sessionId, reporterId: userId }
        });

        if (existing) {
            throw new BadRequestException('You have already reported a dispute for this session');
        }

        // 3. Create Dispute
        // Amount is the session price
        return this.prisma.dispute.create({
            data: {
                sessionId,
                reporterId: userId,
                amount: session.price,
                reason,
                description,
                status: 'PENDING'
            }
        });
    }

    async findAll(userId: string, role: Role) {
        if (role === 'ADMIN') {
            return this.prisma.dispute.findMany({
                include: {
                    session: {
                        include: {
                            patient: { select: { id: true, alias: true } },
                            psychologist: { select: { id: true, alias: true } }
                        }
                    },
                    reporter: { select: { id: true, alias: true, email: true } },
                    resolver: { select: { id: true, alias: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            return this.prisma.dispute.findMany({
                where: {
                    OR: [
                        { reporterId: userId },
                        { session: { psychologistId: userId } },
                        { session: { patientId: userId } }
                    ]
                },
                include: {
                    session: true,
                    reporter: { select: { id: true, alias: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        }
    }

    async findOne(id: string) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id },
            include: {
                session: {
                    include: {
                        patient: { select: { id: true, alias: true, email: true } },
                        psychologist: { select: { id: true, alias: true, email: true } }
                    }
                },
                reporter: { select: { id: true, alias: true, email: true } },
                resolver: { select: { id: true, alias: true } }
            }
        });

        if (!dispute) throw new NotFoundException('Dispute not found');
        return dispute;
    }

    async resolve(id: string, adminId: string, resolveDto: ResolveDisputeDto) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id },
            include: { session: true }
        });

        if (!dispute) throw new NotFoundException('Dispute not found');
        if (dispute.status !== 'PENDING') throw new BadRequestException('Dispute is already resolved');

        const { action, notes } = resolveDto;
        let status: DisputeStatus = 'RESOLVED';

        if (action === DisputeResolutionAction.DISMISS) {
            status = 'DISMISSED';
        } else if (action === DisputeResolutionAction.REFUND) {
            status = 'REFUNDED';

            // Process Refund Transaction
            // 1. Check if patient paid
            // Assuming session price was taken from patient wallet.
            // We need to refund to patient wallet.

            const patientId = dispute.session.patientId;
            if (patientId) {
                const wallet = await this.prisma.wallet.findUnique({ where: { userId: patientId } });
                if (wallet) {
                    await this.prisma.$transaction([
                        this.prisma.wallet.update({
                            where: { id: wallet.id },
                            data: { balance: { increment: dispute.amount } }
                        }),
                        this.prisma.transaction.create({
                            data: {
                                walletId: wallet.id,
                                amount: dispute.amount,
                                type: 'REFUND',
                                status: 'COMPLETED',
                                description: `Refund for dispute ${dispute.id}`,
                                referenceId: dispute.id
                            }
                        })
                    ]);
                }
            }

            // Note: If psychologist was already paid, we should deduct from them?
            // Implementing strict ledger logic is complex. For now, we refund the patient (platform loss or clawback).
            // Let's assume platform covers it or we deduct later. 
            // Logic: Refund Patient.
        }

        return this.prisma.dispute.update({
            where: { id },
            data: {
                status,
                resolutionNotes: notes,
                resolvedBy: adminId,
                resolvedAt: new Date()
            }
        });
    }
}
