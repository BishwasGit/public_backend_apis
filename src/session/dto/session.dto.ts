import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

enum SessionType {
  ONE_ON_ONE = 'ONE_ON_ONE',
  GROUP = 'GROUP',
}

export class CreateSessionDto {
  @ApiProperty({
    example: '2025-12-21T10:00:00Z',
    description: 'Session start time (ISO 8601)',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    example: '2025-12-21T11:00:00Z',
    description: 'Session end time (ISO 8601)',
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    example: 100,
    description: 'Session price in USD',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    enum: SessionType,
    example: 'ONE_ON_ONE',
    description: 'Session type',
  })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  @ApiPropertyOptional({
    example: 'Anxiety Support Group',
    description: 'Title for group sessions',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Maximum participants for group sessions',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;
}

export class RequestSessionDto {
  @ApiProperty({ example: 'psych-id-123', description: 'Psychologist ID' })
  @IsString()
  psychologistId: string;

  @ApiProperty({
    example: '2025-12-21T10:00:00Z',
    description: 'Preferred start time',
  })
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({
    example: 'I would like to discuss anxiety management',
    description: 'Session notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
