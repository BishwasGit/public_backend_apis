import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

enum ServiceType {
  VIDEO = 'VIDEO',
  AUDIO_ONLY = 'AUDIO_ONLY',
  CHAT = 'CHAT',
  GROUP = 'GROUP',
}

enum BillingType {
  PER_SESSION = 'PER_SESSION',
  PER_MINUTE = 'PER_MINUTE',
  BUNDLE_7_DAY = 'BUNDLE_7_DAY',
  BUNDLE_30_DAY = 'BUNDLE_30_DAY',
}

export class CreateServiceOptionDto {
  @ApiProperty({
    example: 'Video Therapy Session',
    description: 'Service name',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'One-on-one video therapy session',
    description: 'Service description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 100, description: 'Price in USD', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 60, description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({
    enum: ServiceType,
    example: 'VIDEO',
    description: 'Service type',
  })
  @IsEnum(ServiceType)
  type: ServiceType;

  @ApiProperty({
    enum: BillingType,
    example: 'PER_SESSION',
    description: 'Billing type',
  })
  @IsEnum(BillingType)
  billingType: BillingType;

  @ApiPropertyOptional({ example: true, description: 'Is service enabled' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
