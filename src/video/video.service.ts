import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class VideoService {
  constructor(private configService: ConfigService) {}

  getServerUrl(): string {
    return (
      this.configService.get<string>('LIVEKIT_URL') || 'ws://localhost:7880'
    );
  }

  async generateToken(
    userId: string,
    alias: string,
    roomName: string,
    role: 'admin' | 'publisher' | 'subscriber' = 'publisher',
  ) {
    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY');
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new BadRequestException('LiveKit credentials not configured');
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: alias,
      ttl: 7200, // 2 hours access for session duration
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true, // Allow all users to publish video/audio
      canSubscribe: true, // Allow all users to receive video/audio
      canPublishData: true, // Enable data channels for chat
      canUpdateOwnMetadata: true, // Allow users to update their own metadata
    });

    return at.toJwt();
  }
}
