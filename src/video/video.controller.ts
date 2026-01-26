import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VideoService } from './video.service';

@Controller('video')
@ApiTags('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) { }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('token')
  @ApiOperation({ summary: 'Generate video call token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roomName: { type: 'string', example: 'room-123' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Token generated successfully' })
  async getToken(@Request() req, @Body('roomName') roomName: string) {
    if (!roomName) throw new BadRequestException('Room Name is required');

    // Allow any room name for now (Prototype Mode)
    return {
      token: await this.videoService.generateToken(
        req.user.id,
        req.user.alias || 'user',
        roomName,
        'publisher',
      ),
      roomName: roomName,
      serverUrl: this.videoService.getServerUrl(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('config')
  @ApiOperation({ summary: 'Get video server configuration' })
  @ApiResponse({ status: 200, description: 'Configuration returned successfully' })
  getConfig() {
    return {
      serverUrl: this.videoService.getServerUrl(),
    };
  }

  // Simple GET endpoint for testing (no auth required)
  @Get('getToken')
  @ApiOperation({ summary: 'Get test token (public)' })
  @ApiResponse({ status: 200, description: 'Test token generated successfully' })
  async getTestToken() {
    const roomName = 'quickstart-room';
    const participantIdentity =
      'user-' + Math.random().toString(36).substring(7);

    try {
      const token = await this.videoService.generateToken(
        participantIdentity,
        'Test User',
        roomName,
        'publisher',
      );

      return {
        token,
        roomName,
        identity: participantIdentity,
        serverUrl: this.videoService.getServerUrl(),
      };
    } catch (error) {
      throw new BadRequestException('Error generating token: ' + error.message);
    }
  }
}
