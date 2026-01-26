import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard) // Protect all analytics routes
@ApiTags('analytics')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  // Dashboard Overview - Key Metrics
  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview statistics' })
  @ApiResponse({ status: 200, description: 'Overview metrics returned successfully' })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  // Legacy endpoint (kept for backward compatibility)
  @Get('summary')
  @ApiOperation({ summary: 'Get simple summary statistics (Legacy)' })
  @ApiResponse({ status: 200, description: 'Summary statistics returned successfully' })
  getSummary() {
    return this.analyticsService.getSummary();
  }

  // Activity Graph - Sessions over time
  @Get('activity-graph')
  @ApiOperation({ summary: 'Get activity graph data' })
  @ApiResponse({ status: 200, description: 'Activity graph data returned successfully' })
  getActivityGraph(@Query('days') days?: string) {
    const numDays = days ? parseInt(days) : 7;
    return this.analyticsService.getActivityGraph(numDays);
  }

  // User Performance - Top psychologists
  @Get('user-performance')
  @ApiOperation({ summary: 'Get top performing psychologists' })
  @ApiResponse({ status: 200, description: 'Performance data returned successfully' })
  getUserPerformance(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit) : 5;
    return this.analyticsService.getUserPerformance(numLimit);
  }

  // User Retention - Patient engagement
  @Get('retention')
  @ApiOperation({ summary: 'Get user retention analysis' })
  @ApiResponse({ status: 200, description: 'Retention analysis returned successfully' })
  getRetention() {
    return this.analyticsService.getRetention();
  }

  // Supply & Demand - Session distribution by hour
  @Get('supply-demand')
  @ApiOperation({ summary: 'Get supply and demand data (sessions by hour)' })
  @ApiResponse({ status: 200, description: 'Supply and demand data returned successfully' })
  getSupplyDemand() {
    return this.analyticsService.getSupplyDemand();
  }

  // Platform Health - Session status distribution
  @Get('platform-health')
  @ApiOperation({ summary: 'Get platform health statistics' })
  @ApiResponse({ status: 200, description: 'Platform health data returned successfully' })
  getPlatformHealth() {
    return this.analyticsService.getPlatformHealth();
  }

  // Revenue Analytics
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue data returned successfully' })
  getRevenue(@Query('period') period?: string) {
    return this.analyticsService.getRevenue(period || 'month');
  }

  // User Growth
  @Get('user-growth')
  @ApiOperation({ summary: 'Get user growth over time' })
  @ApiResponse({ status: 200, description: 'User growth data returned successfully' })
  getUserGrowth(@Query('days') days?: string) {
    const numDays = days ? parseInt(days) : 30;
    return this.analyticsService.getUserGrowth(numDays);
  }

  // Real-time Stats
  @Get('realtime')
  @ApiOperation({ summary: 'Get real-time platform statistics' })
  @ApiResponse({ status: 200, description: 'Real-time stats returned successfully' })
  getRealtime() {
    return this.analyticsService.getRealtime();
  }

  // Session Statistics
  @Get('sessions/stats')
  @ApiOperation({ summary: 'Get general session statistics' })
  @ApiResponse({ status: 200, description: 'Session stats returned successfully' })
  getSessionStats() {
    return this.analyticsService.getSessionStats();
  }

  // Wallet Statistics
  @Get('wallet/stats')
  @ApiOperation({ summary: 'Get wallet and transaction statistics' })
  @ApiResponse({ status: 200, description: 'Wallet stats returned successfully' })
  getWalletStats() {
    return this.analyticsService.getWalletStats();
  }
}
