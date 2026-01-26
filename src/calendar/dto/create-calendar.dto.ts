import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EventType } from '../../../generated/client';

export class CreateCalendarDto {
  @ApiProperty({ example: 'Therapy Session', description: 'Title of the calendar event' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Weekly session with patient', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2025-12-25T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2025-12-25T11:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ enum: EventType, example: EventType.SESSION, required: false })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiProperty({ example: 'Room 101', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'https://meet.google.com/abc-defg-hij', required: false })
  @IsString()
  @IsOptional()
  meetingLink?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiProperty({ example: 'FREQ=WEEKLY;INTERVAL=1', required: false })
  @IsString()
  @IsOptional()
  recurrence?: string;

  @ApiProperty({ example: [15, 60], description: 'Minutes before event to remind', required: false })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  reminders?: number[];

  @ApiProperty({ example: 'uuid-1234', required: false })
  @IsString()
  @IsOptional()
  sessionId?: string;
}
