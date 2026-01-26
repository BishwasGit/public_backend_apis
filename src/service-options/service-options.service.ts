import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingType, ServiceType } from '../../generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceOptionDto } from './dto/create-service-option.dto';

@Injectable()
export class ServiceOptionsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, dto: CreateServiceOptionDto) {
    return this.prisma.serviceOption.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        price: parseFloat(dto.price.toString()),
        duration: dto.duration ? parseInt(dto.duration.toString()) : null,
        type: dto.type as ServiceType,
        billingType: dto.billingType as BillingType,
      },
    });
  }

  async update(userId: string, id: string, dto: Partial<CreateServiceOptionDto>) {
    // Verify ownership
    const existing = await this.prisma.serviceOption.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Service not found or unauthorized');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = parseFloat(dto.price.toString());
    if (dto.duration !== undefined) data.duration = dto.duration ? parseInt(dto.duration.toString()) : null;
    if (dto.type !== undefined) data.type = dto.type as ServiceType;
    if (dto.billingType !== undefined) data.billingType = dto.billingType as BillingType;
    if (dto.isEnabled !== undefined) data.isEnabled = dto.isEnabled;

    return this.prisma.serviceOption.update({
      where: { id },
      data,
    });
  }

  async findAllByPsychologist(userId: string) {
    return this.prisma.serviceOption.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const option = await this.prisma.serviceOption.findUnique({
      where: { id },
    });
    if (!option) throw new NotFoundException('Service option not found');
    return option;
  }

  async remove(userId: string, id: string) {
    return this.prisma.serviceOption.deleteMany({
      where: { id, userId }, // Ensure ownership
    });
  }
}
