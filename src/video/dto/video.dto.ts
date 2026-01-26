import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GenerateTokenDto {
  @ApiProperty({
    example: 'therapy-room-123',
    description: 'Video call room name',
  })
  @IsString()
  roomName: string;
}
