import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { lookup } from 'mime-types';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Controller('media')
export class MediaServeController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  @Get('test')
  testRoute() {
    return { status: 'ok', message: 'MediaController is active' };
  }

  // Public endpoint to get all image filenames for a psychologist
  @Get('manager/public-gallery/:psychologistId')
  async getPublicGallery(@Param('psychologistId') psychologistId: string) {
    const folders = await this.prisma.mediaFolder.findMany({
      where: { psychologistId },
      include: { files: true },
    });
    const images = folders.flatMap(folder =>
      folder.files.filter(f => f.type === 'IMAGE').map(f => ({
        filename: f.filename,
        folder: folder.name,
      }))
    );
    return images;
  }

  @Get('private/:filename')
  async servePrivateMedia(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'private_uploads', filename);
    if (!existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    
    // Set proper content type based on file extension
    const ext = extname(filename).toLowerCase();
    const contentType = lookup(ext) || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const stream = createReadStream(filePath);
    stream.pipe(res);
  }
}
