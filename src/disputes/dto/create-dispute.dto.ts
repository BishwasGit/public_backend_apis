
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateDisputeDto {
    @ApiProperty({ description: 'ID of the session to dispute' })
    @IsUUID()
    @IsNotEmpty()
    sessionId: string;

    @ApiProperty({ description: 'Reason for the dispute' })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiProperty({ description: 'Detailed description of the issue' })
    @IsString()
    @IsNotEmpty()
    description: string;
}
