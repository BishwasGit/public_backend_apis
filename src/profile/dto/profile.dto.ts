import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Display Name' })
  @IsOptional()
  @IsString()
  alias?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'MALE', description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: '1990-01-01', description: 'Date of Birth' })
  @IsOptional()
  @IsString() // Using string for date input simplifies handling
  dateOfBirth?: string;
  @ApiPropertyOptional({
    example: 'Experienced psychologist specializing in anxiety and depression',
    description: 'Professional bio',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: ['Anxiety', 'Depression', 'Stress Management'],
    description: 'Areas of expertise',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({
    example: ['English', 'Spanish'],
    description: 'Languages spoken',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    example: 60,
    description: 'Hourly rate in USD',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: true, description: 'Online status' })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}

export class VerifyPsychologistDto {
  @ApiProperty({ example: true, description: 'Verification status' })
  @IsBoolean()
  isVerified: boolean;
}
