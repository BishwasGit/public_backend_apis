import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('translations')
export class TranslationController {
  constructor(private readonly prisma: PrismaService) {}

  // Get all translations formatted for frontend: { en: { key: val }, ne: { key: val } }
  @Get('resources')
  async getResources() {
    const translations = await this.prisma.translation.findMany({
      include: { language: true },
    });

    const resources: Record<string, any> = {};

    translations.forEach(t => {
      const langCode = t.language.code;
      if (!resources[langCode]) {
        resources[langCode] = {};
      }
      resources[langCode][t.key] = t.value;
    });

    return resources;
  }

  @Get()
  async findAll(@Query('languageId') languageId?: string) {
    const where = languageId ? { languageId } : {};
    return this.prisma.translation.findMany({
      where,
      include: { language: true },
    });
  }

  @Post()
  async createOrUpdate(@Body() data: { key: string; value: string; languageId: string }) {
    // Upsert logic
    const existing = await this.prisma.translation.findUnique({
      where: {
        languageId_key: {
          languageId: data.languageId,
          key: data.key,
        },
      },
    });

    if (existing) {
        return this.prisma.translation.update({
            where: { id: existing.id },
            data: { value: data.value },
        });
    }

    return this.prisma.translation.create({
      data: {
        key: data.key,
        value: data.value,
        languageId: data.languageId,
      },
    });
  }
}
