import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ description: 'Name of the folder', example: 'My Folder' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;
}

export class RenameFolderDto {
  @ApiProperty({ description: 'New name of the folder', example: 'Renamed Folder' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;
}
