import { Injectable, NotFoundException } from '@nestjs/common';
import { EventType } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: any) {
    return this.prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        type: data.type || EventType.PERSONAL,
        creatorId: userId,
        location: data.location,
        meetingLink: data.meetingLink,
        isRecurring: data.isRecurring || false,
        recurrence: data.recurrence,
        reminders: data.reminders || [],
        sessionId: data.sessionId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.calendarEvent.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { EventParticipants: { some: { B: userId } } },
        ],
      },
      orderBy: { startTime: 'asc' },
      include: {
        creator: { select: { alias: true } },
        EventParticipants: { 
          include: { 
            User: { select: { id: true, alias: true } } 
          } 
        },
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        creator: { select: { alias: true, email: true } },
        EventParticipants: { 
          include: { 
            User: { select: { id: true, alias: true, email: true } } 
          } 
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(id: string, data: any) {
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        location: data.location,
        meetingLink: data.meetingLink,
        isRecurring: data.isRecurring,
        recurrence: data.recurrence,
        reminders: data.reminders,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.calendarEvent.delete({
      where: { id },
    });
  }

  // Auto-create event for session
  async createFromSession(session: any) {
    const patient = session.patient || await this.prisma.user.findUnique({ where: { id: session.patientId } });
    
    return this.create(session.psychologistId, {
      title: `Session with ${patient?.alias || 'Patient'}`,
      description: `Therapy session - ${session.type}`,
      startTime: session.startTime,
      endTime: session.endTime,
      type: EventType.SESSION,
      sessionId: session.id,
      meetingLink: session.meetingLink,
      reminders: [30, 60], // 30 min and 1 hour before
    });
  }
}
