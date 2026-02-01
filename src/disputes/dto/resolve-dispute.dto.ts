
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum DisputeResolutionAction {
    REFUND = 'REFUND',
    DISMISS = 'DISMISS',
}

export class ResolveDisputeDto {
    @ApiProperty({ enum: DisputeResolutionAction, description: 'Action to take' })
    @IsEnum(DisputeResolutionAction)
    @IsNotEmpty()
    action: DisputeResolutionAction;

    @ApiPropertyOptional({ description: 'Notes on the resolution' })
    @IsOptional()
    @IsString()
    notes?: string;
}
