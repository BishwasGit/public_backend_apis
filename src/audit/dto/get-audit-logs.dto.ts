import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AuditEntity } from '../audit.service';

export class GetAuditLogsDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsEnum(AuditEntity)
    entity?: AuditEntity;

    @IsOptional()
    @IsString()
    entityId?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 100;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number = 0;
}
