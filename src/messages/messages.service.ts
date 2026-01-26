import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto) {
    const { senderId, receiverId, content } = createMessageDto;
    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: { id: true, alias: true, role: true },
        },
        receiver: {
          select: { id: true, alias: true, role: true },
        },
      },
    });
  }

  async findAll() {
      // For now, return all messages (admin usage) or throw error
      // Better to implement getConversation logic
      return [];
  }

  async findOne(id: number) {
      // Message ID is string UUID
    return `This action returns a #${id} message`;
  }

  async update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  async remove(id: number) {
    return `This action removes a #${id} message`;
  }

  // Custom methods
  async getConversations(userId: string) {
      // Find all unique users communicated with
      const messages = await this.prisma.message.findMany({
          where: {
              OR: [
                  { senderId: userId },
                  { receiverId: userId },
              ],
          },
          orderBy: { createdAt: 'desc' },
          include: {
              sender: { select: { id: true, alias: true, role: true } },
              receiver: { select: { id: true, alias: true, role: true } },
          },
      });

      const conversationMap = new Map();
      
      messages.forEach(msg => {
          const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
          if (!conversationMap.has(otherUser.id)) {
              conversationMap.set(otherUser.id, {
                  user: otherUser,
                  lastMessage: msg,
              });
          }
      });

      return Array.from(conversationMap.values());
  }

  async getMessages(userId: string, otherUserId: string) {
      return this.prisma.message.findMany({
          where: {
              OR: [
                  { senderId: userId, receiverId: otherUserId },
                  { senderId: otherUserId, receiverId: userId },
              ],
          },
          orderBy: { createdAt: 'asc' },
          include: {
              sender: { select: { id: true, alias: true, role: true } },
          },
      });
  }
}
