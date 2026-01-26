import { Injectable } from '@nestjs/common';
import { SessionStatus, TransactionType } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Comprehensive Dashboard Overview
  async getOverview() {
    const [
      totalUsers,
      totalPsychologists,
      verifiedPsychologists,
      totalPatients,
      totalSessions,
      completedSessions,
      liveSessions,
      totalRevenue,
      totalTransactions,
      activeUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'PSYCHOLOGIST' } }),
      this.prisma.user.count({
        where: { role: 'PSYCHOLOGIST', isVerified: true },
      }),
      this.prisma.user.count({ where: { role: 'PATIENT' } }),
      this.prisma.session.count(),
      this.prisma.session.count({ where: { status: SessionStatus.COMPLETED } }),
      this.prisma.session.count({ where: { status: SessionStatus.LIVE } }),
      this.prisma.session.aggregate({
        _sum: { price: true },
        where: { status: SessionStatus.COMPLETED },
      }),
      this.prisma.transaction.count(),
      this.prisma.user.count({ where: { isOnline: true } }),
    ]);

    // Calculate growth rates (comparing last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [recentUsers, previousUsers, recentSessions, previousSessions] =
      await Promise.all([
        this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        this.prisma.user.count({
          where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        }),
        this.prisma.session.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        this.prisma.session.count({
          where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        }),
      ]);

    const userGrowth =
      previousUsers > 0
        ? ((recentUsers - previousUsers) / previousUsers) * 100
        : 0;
    const sessionGrowth =
      previousSessions > 0
        ? ((recentSessions - previousSessions) / previousSessions) * 100
        : 0;

    return {
      users: {
        total: totalUsers,
        psychologists: totalPsychologists,
        verifiedPsychologists: verifiedPsychologists,
        patients: totalPatients,
        active: activeUsers,
        growth: Math.round(userGrowth * 10) / 10,
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        live: liveSessions,
        scheduled: await this.prisma.session.count({
          where: { status: SessionStatus.SCHEDULED },
        }),
        cancelled: await this.prisma.session.count({
          where: { status: SessionStatus.CANCELLED },
        }),
        growth: Math.round(sessionGrowth * 10) / 10,
      },
      revenue: {
        total: totalRevenue._sum.price || 0,
        transactions: totalTransactions,
        averageSessionPrice:
          completedSessions > 0
            ? (totalRevenue._sum.price || 0) / completedSessions
            : 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Legacy summary endpoint
  async getSummary() {
    const totalUsers = await this.prisma.user.count();
    const totalSessions = await this.prisma.session.count();
    const revenueResult = await this.prisma.session.aggregate({
      _sum: { price: true },
      where: { status: SessionStatus.COMPLETED },
    });

    return {
      users: totalUsers,
      sessions: totalSessions,
      revenue: revenueResult._sum.price || 0,
    };
  }

  // Activity Graph - Sessions and Revenue over time
  async getActivityGraph(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await this.prisma.session.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, price: true, status: true },
    });

    // Group by date
    const grouped: Record<string, any> = {};
    sessions.forEach((s) => {
      const date = s.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { date, sessions: 0, revenue: 0, completed: 0 };
      }
      grouped[date].sessions++;
      if (s.status === SessionStatus.COMPLETED) {
        grouped[date].revenue += s.price || 0;
        grouped[date].completed++;
      }
    });

    return Object.values(grouped).sort((a: any, b: any) =>
      a.date.localeCompare(b.date),
    );
  }

  // Top Performing Psychologists
  async getUserPerformance(limit: number = 5) {
    const topPsychs = await this.prisma.session.groupBy({
      by: ['psychologistId'],
      _count: { id: true },
      _sum: { price: true },
      where: { status: SessionStatus.COMPLETED },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const result: any[] = [];
    for (const item of topPsychs) {
      const user = await this.prisma.user.findUnique({
        where: { id: item.psychologistId },
        select: { alias: true, specialties: true, hourlyRate: true },
      });
      result.push({
        alias: user?.alias || 'Unknown',
        sessions: item._count.id,
        revenue: item._sum.price || 0,
        specialties: user?.specialties || [],
        hourlyRate: user?.hourlyRate || 0,
      });
    }
    return result;
  }

  // Patient Retention Analysis
  async getRetention() {
    const patients = await this.prisma.session.groupBy({
      by: ['patientId'],
      _count: { id: true },
      where: {
        status: SessionStatus.COMPLETED,
        patientId: { not: null },
      },
    });

    let oneTime = 0;
    let returning = 0;
    let loyal = 0; // 5+ sessions

    patients.forEach((p) => {
      if (p._count.id >= 5) loyal++;
      else if (p._count.id > 1) returning++;
      else oneTime++;
    });

    return [
      {
        name: 'One-Time',
        value: oneTime,
        percentage: Math.round((oneTime / patients.length) * 100),
      },
      {
        name: 'Returning',
        value: returning,
        percentage: Math.round((returning / patients.length) * 100),
      },
      {
        name: 'Loyal',
        value: loyal,
        percentage: Math.round((loyal / patients.length) * 100),
      },
    ];
  }

  // Supply & Demand - Sessions by hour
  async getSupplyDemand() {
    const allSessions = await this.prisma.session.findMany({
      select: { startTime: true },
    });

    const hours = Array(24)
      .fill(0)
      .map((_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        sessions: 0,
      }));

    allSessions.forEach((s) => {
      const h = new Date(s.startTime).getHours();
      if (hours[h]) hours[h].sessions++;
    });

    return hours;
  }

  // Platform Health - Session outcomes
  async getPlatformHealth() {
    const statusCounts = await this.prisma.session.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const total = statusCounts.reduce((sum, s) => sum + s._count.id, 0);

    return statusCounts.map((s) => ({
      name: s.status,
      value: s._count.id,
      percentage: Math.round((s._count.id / total) * 100),
    }));
  }

  // Revenue Analytics
  async getRevenue(period: string = 'month') {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const [totalRevenue, platformFees, psychologistEarnings, refunds] =
      await Promise.all([
        this.prisma.session.aggregate({
          _sum: { price: true },
          where: {
            status: SessionStatus.COMPLETED,
            createdAt: { gte: startDate },
          },
        }),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            type: TransactionType.SESSION_PAYMENT,
            createdAt: { gte: startDate },
          },
        }),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            type: TransactionType.SESSION_PAYMENT,
            createdAt: { gte: startDate },
          },
        }),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            type: TransactionType.REFUND,
            createdAt: { gte: startDate },
          },
        }),
      ]);

    const gross = totalRevenue._sum.price || 0;
    const net = psychologistEarnings._sum.amount || 0;
    const fees = gross - net;

    return {
      period,
      gross,
      net,
      platformFees: fees,
      refunds: Math.abs(refunds._sum.amount || 0),
      transactionCount: await this.prisma.transaction.count({
        where: { createdAt: { gte: startDate } },
      }),
    };
  }

  // User Growth Over Time
  async getUserGrowth(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, role: true },
    });

    const grouped: Record<string, any> = {};
    users.forEach((u) => {
      const date = u.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = {
          date,
          total: 0,
          patients: 0,
          psychologists: 0,
          admins: 0,
        };
      }
      grouped[date].total++;
      if (u.role === 'PATIENT') grouped[date].patients++;
      if (u.role === 'PSYCHOLOGIST') grouped[date].psychologists++;
      if (u.role === 'ADMIN') grouped[date].admins++;
    });

    return Object.values(grouped).sort((a: any, b: any) =>
      a.date.localeCompare(b.date),
    );
  }

  // Real-time Statistics
  async getRealtime() {
    const [liveSessions, onlineUsers, onlinePsychologists, recentSignups] =
      await Promise.all([
        this.prisma.session.findMany({
          where: { status: SessionStatus.LIVE },
          include: {
            psychologist: { select: { alias: true } },
            patient: { select: { alias: true } },
          },
        }),
        this.prisma.user.count({ where: { isOnline: true } }),
        this.prisma.user.count({
          where: { isOnline: true, role: 'PSYCHOLOGIST' },
        }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

    return {
      liveSessions: liveSessions.length,
      onlineUsers,
      onlinePsychologists,
      recentSignups,
      sessions: liveSessions.map((s) => ({
        id: s.id,
        psychologist: s.psychologist.alias,
        patient: s.patient?.alias || 'Group Session',
        startTime: s.startTime,
        price: s.price,
      })),
    };
  }

  // Session Statistics
  async getSessionStats() {
    const [total, byType, byStatus, avgDuration] = await Promise.all([
      this.prisma.session.count(),
      this.prisma.session.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
      this.prisma.session.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.session.aggregate({
        _avg: { price: true },
      }),
    ]);

    return {
      total,
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      averagePrice: avgDuration._avg.price || 0,
    };
  }

  // Wallet Statistics
  async getWalletStats() {
    const [totalBalance, totalDeposits, totalWithdrawals, avgBalance] =
      await Promise.all([
        this.prisma.wallet.aggregate({ _sum: { balance: true } }),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: TransactionType.DEPOSIT },
        }),
        this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: TransactionType.WITHDRAWAL },
        }),
        this.prisma.wallet.aggregate({ _avg: { balance: true } }),
      ]);

    const topWallets = await this.prisma.wallet.findMany({
      take: 5,
      orderBy: { balance: 'desc' },
      include: { user: { select: { alias: true, role: true } } },
    });

    return {
      totalBalance: totalBalance._sum.balance || 0,
      totalDeposits: totalDeposits._sum.amount || 0,
      totalWithdrawals: Math.abs(totalWithdrawals._sum.amount || 0),
      averageBalance: avgBalance._avg.balance || 0,
      topWallets: topWallets.map((w) => ({
        alias: w.user.alias,
        role: w.user.role,
        balance: w.balance,
      })),
    };
  }
}
