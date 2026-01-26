import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    senderId: string;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    receiverId: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}
