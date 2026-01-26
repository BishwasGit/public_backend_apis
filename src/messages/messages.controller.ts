import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get('conversations')
  getConversations(@Request() req) {
      return this.messagesService.getConversations(req.user.id);
  }

  @Get('conversation/:userId')
  getMessages(@Request() req, @Param('userId') otherUserId: string) {
      return this.messagesService.getMessages(req.user.id, otherUserId);
  }
}
