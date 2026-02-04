import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  Role,
  SessionStatus,
  SessionType,
} from '../../generated/client';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private calendarService: CalendarService,
    private notificationsService: NotificationsService,
  ) { }

  async createSession(psychologistId: string, data: any) {
    // Validation: Ensure time is in future, etc.
    const user = await this.prisma.user.findUnique({
      where: { id: psychologistId },
    });
    if (!user || user.role !== Role.PSYCHOLOGIST)
      throw new BadRequestException('Only psychologists can create sessions');

    return this.prisma.session.create({
      data: {
        psychologistId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        price: data.price || user.hourlyRate || 50, // Default to user rate or 50
        type: data.type || SessionType.ONE_ON_ONE,
        title: data.title,
        maxParticipants: data.maxParticipants ?? 1,
        status: SessionStatus.SCHEDULED,
      },
    });
  }

  async joinGroupSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { participants: true },
    });

    if (!session) throw new NotFoundException('Session not found');
    if (session.type !== SessionType.GROUP) {
      throw new BadRequestException('Not a group session');
    }
    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Session is not available for joining');
    }
    if (session.participants.length >= session.maxParticipants) {
      throw new ConflictException('Session is full');
    }
    if (session.participants.some((p) => p.id === userId)) {
      throw new ConflictException('Already joined this session');
    }

    // 1. Check Wallet & Reserve
    await this.walletService.reserve(userId, session.price);

    // 2. Add to participants
    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        participants: { connect: { id: userId } },
      },
      include: {
        participants: { select: { alias: true, id: true } },
        psychologist: { select: { alias: true } },
      },
    });

    // 3. Notify Psychologist
    await this.notificationsService.create(
      session.psychologistId,
      'New Group Participant',
      `A new participant has joined your group session: ${session.title || 'Group Session'}`,
      NotificationType.SESSION_REQUEST,
    );

    return updatedSession;
  }

  async getSessions(userId: string, role: string) {
    if (role === Role.PSYCHOLOGIST) {
      return this.prisma.session.findMany({
        where: { psychologistId: userId },
        orderBy: { startTime: 'asc' },
        include: {
          patient: { select: { alias: true } },
          psychologist: { select: { alias: true } },
          participants: { select: { alias: true, id: true } },
        },
      });
    } else {
      // Patients see sessions they booked OR available open sessions
      // For now, let's just show sessions they booked or are participating in
      return this.prisma.session.findMany({
        where: {
          OR: [
            { patientId: userId },
            { participants: { some: { id: userId } } },
          ],
        },
        orderBy: { startTime: 'asc' },
        include: {
          psychologist: { select: { alias: true, bio: true } },
          patient: { select: { alias: true } },
          participants: { select: { alias: true, id: true } },
        },
      });
    }
  }

  async getAllSessions() {
    return this.prisma.session.findMany({
      orderBy: { startTime: 'desc' },
      include: {
        psychologist: { select: { alias: true } },
        patient: { select: { alias: true } },
      },
    });
  }

  async getSessionById(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        psychologist: {
          select: {
            alias: true,
            bio: true,
            email: true,
          },
        },
        patient: {
          select: {
            alias: true,
            email: true,
          },
        },
        participants: {
          select: {
            id: true,
            alias: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async getAvailableSessions(psychologistId: string) {
    return this.prisma.session.findMany({
      where: {
        psychologistId,
        status: SessionStatus.SCHEDULED,
        patientId: null, // Open slot
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async bookSession(patientId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== SessionStatus.SCHEDULED || session.patientId) {
      throw new ConflictException('Session not available');
    }

    // 1. Check Wallet Balance & Reserve Funds
    await this.walletService.reserve(patientId, session.price);

    // 2. Book Session
    const bookedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        patientId,
        status: SessionStatus.SCHEDULED, // Still scheduled, but now booked
      },
      include: {
        patient: { select: { alias: true } },
        psychologist: { select: { alias: true } },
      },
    });

    // 3. Auto-create Calendar Event
    try {
      await this.calendarService.createFromSession(bookedSession);
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      // Don't fail the booking if calendar creation fails
    }

    return bookedSession;
  }
  async validateSessionAccess(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { participants: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    // Check if user is participant (psychologist or patient or in participants list)
    const isParticipant =
      session.psychologistId === userId ||
      session.patientId === userId ||
      session.participants.some((p) => p.id === userId);

    if (!isParticipant) {
      throw new ConflictException('You are not a participant in this session');
    }

    // Optional: Check time window (e.g., enable 5 mins before start)
    const now = new Date();
    const startWindow = new Date(session.startTime);
    startWindow.setMinutes(startWindow.getMinutes() - 10); // Check-in 10 min early allowed

    if (now < startWindow && session.psychologistId !== userId) {
      throw new ConflictException('Session has not started yet');
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new ConflictException('Session was cancelled');
    }

    return session;
  }
  async requestSession(patientId: string, psychologistId: string, data: any) {
    // Validation
    const user = await this.prisma.user.findUnique({
      where: { id: psychologistId },
    });
    if (!user || user.role !== Role.PSYCHOLOGIST)
      throw new BadRequestException('Invalid psychologist');

    let price = data.price || 100;
    let duration = 60; // Default

    // Dynamic Pricing via ServiceOption
    if (data.serviceOptionId) {
      const option = await this.prisma.serviceOption.findUnique({
        where: { id: data.serviceOptionId },
      });
      if (!option || option.userId !== psychologistId) {
        throw new BadRequestException('Invalid Service Option');
      }
      price = option.price;
      if (option.duration) duration = option.duration;

      // Handle Billing Types (Simple MVP)
      if (option.billingType === 'PER_MINUTE' && data.minutes) {
        price = option.price * data.minutes;
        duration = data.minutes;
      }
    }

    // 1. Process Payment/Wallet Reservation
    // Check balance
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: patientId },
    });
    if (!wallet || wallet.balance < price) {
      throw new ConflictException('Insufficient balance');
    }

    // Deduct/Reserve
    await this.walletService.reserve(patientId, price);

    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // 2. Create & Book Session
    const session = await this.prisma.session.create({
      data: {
        psychologistId,
        patientId,
        startTime,
        endTime,
        price,
        type: SessionType.ONE_ON_ONE,
        status: SessionStatus.PENDING,
      },
    });

    // 3. Notify Psychologist
    await this.notificationsService.create(
      psychologistId,
      'New Session Request',
      `You have a new session request for ${startTime.toLocaleString()}`,
      NotificationType.SESSION_REQUEST,
    );

    return session;
  }

  async acceptSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.psychologistId !== userId)
      throw new BadRequestException('Not authorized');
    if (session.status !== SessionStatus.PENDING)
      throw new BadRequestException('Session not pending');

    // Funds are already reserved. Payment is processed upon session completion.

    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.SCHEDULED },
    });

    if (session.patientId) {
      await this.notificationsService.create(
        session.patientId,
        'Session Accepted',
        'Your session request has been accepted.',
        NotificationType.SESSION_APPROVED,
      );
    }
    return updatedSession;
  }

  async rejectSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.psychologistId !== userId)
      throw new BadRequestException('Not authorized');
    // Allow cancelling if Pending or Scheduled (if psychologist cancels later)
    if (
      session.status !== SessionStatus.PENDING &&
      session.status !== SessionStatus.SCHEDULED
    ) {
      throw new BadRequestException('Cannot cancel this session');
    }

    // Refund handled for both Pending and Scheduled
    if (session.patientId) {
      await this.walletService.refund(
        session.patientId,
        session.price,
        'Session Cancelled/Rejected',
      );
    }

    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.CANCELLED },
    });

    if (session.patientId) {
      await this.notificationsService.create(
        session.patientId,
        'Session Cancelled',
        'Your session has been cancelled/rejected.',
        NotificationType.SESSION_REJECTED,
      );
    }
    return updatedSession;
  }

  async submitReview(
    patientId: string,
    sessionId: string,
    rating: number,
    comment: string,
  ) {
    // Verify session exists and patient participated
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.patientId !== patientId) {
      throw new BadRequestException('You did not participate in this session');
    }

    if (session.status !== SessionStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed sessions');
    }

    // Create review
    return this.prisma.review.create({
      data: {
        sessionId,
        patientId,
        psychologistId: session.psychologistId,
        rating,
        comment,
      },
    });
  }

  async updateSessionStatus(
    userId: string,
    sessionId: string,
    status: SessionStatus,
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        psychologist: { select: { alias: true } },
        patient: { select: { alias: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Only the psychologist can update session status
    if (session.psychologistId !== userId) {
      throw new BadRequestException(
        'Only the session psychologist can update the status',
      );
    }

    // Validate status transitions
    if (
      status === SessionStatus.LIVE &&
      session.status !== SessionStatus.SCHEDULED
    ) {
      throw new BadRequestException('Can only start a scheduled session');
    }

    if (
      status === SessionStatus.COMPLETED &&
      session.status !== SessionStatus.LIVE
    ) {
      throw new BadRequestException('Can only complete a live session');
    }

    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status },
      include: {
        psychologist: { select: { alias: true } },
        patient: { select: { alias: true } },
      },
    });

    // Process Payment on Completion
    if (status === SessionStatus.COMPLETED && session.patientId) {
      await this.walletService.completePayment(
        session.id, // sessionId
        session.patientId,
        session.psychologistId,
      );
    }

    // Notify patient when session starts
    if (status === SessionStatus.LIVE && session.patientId) {
      await this.notificationsService.create(
        session.patientId,
        'Session Started',
        `Your session with ${session.psychologist.alias} has started. Join now!`,
        NotificationType.SESSION_REMINDER,
      );
    }

    return updatedSession;
  }


  async getGroupSessions() {
    return this.prisma.session.findMany({
      where: {
        type: SessionType.GROUP,
        status: { in: [SessionStatus.SCHEDULED, SessionStatus.LIVE] },
        startTime: { gt: new Date() }, // Changed from endTime to startTime for upcoming sessions
      },
      orderBy: { startTime: 'asc' },
      include: {
        psychologist: { select: { alias: true, profileImage: true } },
        participants: { select: { id: true, alias: true } },
      },
    });
  }
}
