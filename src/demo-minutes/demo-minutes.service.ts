import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DemoMinutesService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get remaining demo minutes for a patient with a specific psychologist
     */
    async getRemainingDemo(
        patientId: string,
        psychologistId: string,
    ): Promise<number> {
        // Get psychologist's demo minutes allocation
        const psychologist = await this.prisma.user.findUnique({
            where: { id: psychologistId },
            select: { demoMinutes: true },
        });

        if (!psychologist || psychologist.demoMinutes === 0) {
            return 0;
        }

        // Get patient's usage with this psychologist
        const usage = await this.prisma.demoMinutesUsage.findUnique({
            where: {
                patientId_psychologistId: {
                    patientId,
                    psychologistId,
                },
            },
        });

        const minutesUsed = usage?.minutesUsed || 0;
        const remaining = Math.max(0, psychologist.demoMinutes - minutesUsed);

        return remaining;
    }

    /**
     * Consume demo minutes and return how many were used
     */
    async consumeDemo(
        patientId: string,
        psychologistId: string,
        requestedMinutes: number,
    ): Promise<number> {
        const remaining = await this.getRemainingDemo(patientId, psychologistId);

        if (remaining === 0) {
            return 0;
        }

        const minutesToConsume = Math.min(requestedMinutes, remaining);

        // Upsert usage record
        await this.prisma.demoMinutesUsage.upsert({
            where: {
                patientId_psychologistId: {
                    patientId,
                    psychologistId,
                },
            },
            update: {
                minutesUsed: { increment: minutesToConsume },
            },
            create: {
                patientId,
                psychologistId,
                minutesUsed: minutesToConsume,
            },
        });

        return minutesToConsume;
    }

    /**
     * Calculate billing with demo minutes applied
     * Returns: { demoUsed, chargeableMinutes, totalMinutes }
     */
    async calculateBillingWithDemo(
        patientId: string,
        psychologistId: string,
        sessionMinutes: number,
    ): Promise<{
        demoUsed: number;
        chargeableMinutes: number;
        totalMinutes: number;
    }> {
        const demoUsed = await this.consumeDemo(
            patientId,
            psychologistId,
            sessionMinutes,
        );
        const chargeableMinutes = sessionMinutes - demoUsed;

        return {
            demoUsed,
            chargeableMinutes,
            totalMinutes: sessionMinutes,
        };
    }

    /**
     * Get demo minutes usage stats for a psychologist
     */
    async getPsychologistDemoStats(psychologistId: string) {
        const psychologist = await this.prisma.user.findUnique({
            where: { id: psychologistId },
            select: { demoMinutes: true },
        });

        const usageRecords = await this.prisma.demoMinutesUsage.findMany({
            where: { psychologistId },
            select: {
                patientId: true,
                minutesUsed: true,
                createdAt: true,
            },
        });

        const totalMinutesGiven = usageRecords.reduce(
            (sum, record) => sum + record.minutesUsed,
            0,
        );
        const uniquePatients = usageRecords.length;

        return {
            demoMinutesOffered: psychologist?.demoMinutes || 0,
            totalMinutesGiven,
            uniquePatients,
            usageRecords,
        };
    }

    /**
   * Get patient's demo usage history
   */
    async getPatientDemoHistory(patientId: string) {
        const usageRecords = await this.prisma.demoMinutesUsage.findMany({
            where: { patientId },
        });

        // Get psychologist details separately to avoid Prisma relation issues
        const recordsWithDetails = await Promise.all(
            usageRecords.map(async (record) => {
                const psychologist = await this.prisma.user.findUnique({
                    where: { id: record.psychologistId },
                    select: {
                        alias: true,
                        demoMinutes: true,
                    },
                });

                return {
                    psychologistId: record.psychologistId,
                    psychologistAlias: psychologist?.alias || 'Unknown',
                    minutesUsed: record.minutesUsed,
                    totalDemoOffered: psychologist?.demoMinutes || 0,
                    remainingDemo: Math.max(
                        0,
                        (psychologist?.demoMinutes || 0) - record.minutesUsed,
                    ),
                    usedAt: record.updatedAt,
                };
            }),
        );

        return recordsWithDetails;
    }

    /**
     * Reset demo minutes for a patient (admin only)
     */
    async resetDemo(patientId: string, psychologistId: string): Promise<void> {
        await this.prisma.demoMinutesUsage.delete({
            where: {
                patientId_psychologistId: {
                    patientId,
                    psychologistId,
                },
            },
        });
    }
}
