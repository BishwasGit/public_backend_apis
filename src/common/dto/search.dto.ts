import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc'
}

export class SearchDto {
    @ApiPropertyOptional({ example: 'anxiety depression', description: 'Search query' })
    @IsOptional()
    @IsString()
    query?: string;

    @ApiPropertyOptional({ example: ['Anxiety', 'Depression'], description: 'Filter by specialties' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specialties?: string[];

    @ApiPropertyOptional({ example: ['English', 'Spanish'], description: 'Filter by languages' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languages?: string[];

    @ApiPropertyOptional({ example: 50, description: 'Minimum hourly rate' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minRate?: number;

    @ApiPropertyOptional({ example: 150, description: 'Maximum hourly rate' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxRate?: number;

    @ApiPropertyOptional({ example: true, description: 'Only verified psychologists' })
    @IsOptional()
    isVerified?: boolean;

    @ApiPropertyOptional({ example: true, description: 'Only online psychologists' })
    @IsOptional()
    isOnline?: boolean;

    @ApiPropertyOptional({ enum: ['hourlyRate', 'createdAt'], example: 'hourlyRate', description: 'Sort by field' })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ enum: SortOrder, example: 'asc', description: 'Sort order' })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder;

    @ApiPropertyOptional({ example: 1, description: 'Page number' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, description: 'Items per page' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}
