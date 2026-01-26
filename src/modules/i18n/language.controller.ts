import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('languages')
export class LanguageController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.language.findMany({
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  async create(@Body() data: { code: string; name: string; isDefault?: boolean }) {
    // If setting as default, unset others first if needed (logic can be enhanced)
    return this.prisma.language.create({
      data,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.prisma.language.delete({
      where: { id },
    });
  }
}
