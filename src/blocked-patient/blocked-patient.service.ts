import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlockedPatientService {
  constructor(private prisma: PrismaService) {}

  async blockPatient(
    psychologistId: string,
    patientId: string,
    reason?: string,
  ) {
    // Check if already blocked
    const existing = await this.prisma.blockedPatient.findUnique({
      where: {
        psychologistId_patientId: {
          psychologistId,
          patientId,
        },
      },
    });

    if (existing) {
      return { message: 'Patient is already blocked' };
    }

    await this.prisma.blockedPatient.create({
      data: {
        psychologistId,
        patientId,
        reason,
      },
    });

    return { message: 'Patient blocked successfully' };
  }

  async unblockPatient(psychologistId: string, patientId: string) {
    await this.prisma.blockedPatient.deleteMany({
      where: {
        psychologistId,
        patientId,
      },
    });

    return { message: 'Patient unblocked successfully' };
  }

  async getBlockedPatients(psychologistId: string) {
    const blocked = await this.prisma.blockedPatient.findMany({
      where: { psychologistId },
    });

    // Fetch patient details
    const patientIds = blocked.map((b) => b.patientId);
    const patients = await this.prisma.user.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, alias: true },
    });

    return blocked.map((b) => ({
      ...b,
      patient: patients.find((p) => p.id === b.patientId),
    }));
  }

  async isPatientBlocked(psychologistId: string, patientId: string) {
    const blocked = await this.prisma.blockedPatient.findUnique({
      where: {
        psychologistId_patientId: {
          psychologistId,
          patientId,
        },
      },
    });

    return { isBlocked: !!blocked };
  }

  async getBlockedPsychologistIds(patientId: string) {
    // Get all psychologists who have blocked this patient
    const blocked = await this.prisma.blockedPatient.findMany({
      where: { patientId },
      select: { psychologistId: true },
    });

    return blocked.map((b) => b.psychologistId);
  }
}
