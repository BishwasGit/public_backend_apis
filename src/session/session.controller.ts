import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SessionService } from './session.service';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiBody({ schema: { type: 'object', properties: { psychologistId: { type: 'string' }, startTime: { type: 'string' }, endTime: { type: 'string' } } } })
  createSession(@Request() req, @Body() body: any) {
    return this.sessionService.createSession(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  @ApiOperation({ summary: 'Get all sessions (Admin/Psychologist)' })
  getAllSessions() {
    return this.sessionService.getAllSessions();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get my sessions' })
  getMySessions(@Request() req) {
    return this.sessionService.getSessions(req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Get('group/all')
  @ApiOperation({ summary: 'List available group sessions' })
  getGroupSessions() {
    return this.sessionService.getGroupSessions();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get session details by ID' })
  getSessionById(@Param('id') id: string) {
    return this.sessionService.getSessionById(id);
  }

  @Get('available/:psychologistId')
  @ApiOperation({ summary: 'Get available slots for a psychologist' })
  getAvailableSessions(@Param('psychologistId') psychologistId: string) {
    return this.sessionService.getAvailableSessions(psychologistId);
  }



  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  @ApiOperation({ summary: 'Join a group session' })
  joinGroupSession(@Request() req, @Param('id') id: string) {
    return this.sessionService.joinGroupSession(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/book')
  @ApiOperation({ summary: 'Book a session slot' })
  bookSession(@Request() req, @Param('id') id: string) {
    return this.sessionService.bookSession(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a session request' })
  acceptSession(@Request() req, @Param('id') id: string) {
    return this.sessionService.acceptSession(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a session request' })
  rejectSession(@Request() req, @Param('id') id: string) {
    return this.sessionService.rejectSession(req.user.id, id);
  }
  @UseGuards(JwtAuthGuard)
  @Post('request')
  @ApiOperation({ summary: 'Request a new session' })
  @ApiBody({ schema: { type: 'object', properties: { psychologistId: { type: 'string' }, requestedTime: { type: 'string' } } } })
  requestSession(@Request() req, @Body() body: any) {
    return this.sessionService.requestSession(
      req.user.id,
      body.psychologistId,
      body,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update session status (start/complete session)' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', enum: ['LIVE', 'COMPLETED', 'CANCELLED'] } }, required: ['status'] } })
  updateSessionStatus(@Request() req, @Param('id') id: string, @Body() body: { status: string }) {
    return this.sessionService.updateSessionStatus(req.user.id, id, body.status as any);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/review')
  @ApiOperation({ summary: 'Submit a review for a session' })
  @ApiBody({ schema: { type: 'object', properties: { rating: { type: 'number', minimum: 1, maximum: 5 }, comment: { type: 'string' } }, required: ['rating'] } })
  submitReview(@Request() req, @Param('id') id: string, @Body() body: { rating: number; comment: string }) {
    return this.sessionService.submitReview(req.user.id, id, body.rating, body.comment);
  }
}
