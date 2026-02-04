import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get current commission percentage
     * Returns default 10.0 if no settings exist
     */
    async getCommissionPercent(): Promise<number> {
        const settings = await this.prisma.systemSettings.findFirst({
            orderBy: { createdAt: 'desc' },
        });
        return settings?.commissionPercent ?? 10.0;
    }

    /**
     * Update commission percentage
     * Creates new settings record if none exists
     */
    async updateCommissionPercent(
        percent: number,
        adminId: string,
    ): Promise<void> {
        if (percent < 0 || percent > 100) {
            throw new Error('Commission percent must be between 0 and 100');
        }

        // Check if settings exist
        const existing = await this.prisma.systemSettings.findFirst();

        if (existing) {
            await this.prisma.systemSettings.update({
                where: { id: existing.id },
                data: {
                    commissionPercent: percent,
                    updatedBy: adminId,
                },
            });
        } else {
            await this.prisma.systemSettings.create({
                data: {
                    commissionPercent: percent,
                    updatedBy: adminId,
                },
            });
        }
    }

    /**
     * Get all settings (for admin dashboard)
     */
    async getSettings() {
        const settings = await this.prisma.systemSettings.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        return {
            commissionPercent: settings?.commissionPercent ?? 10.0,
            updatedAt: settings?.updatedAt,
            updatedBy: settings?.updatedBy,
        };
    }
}
