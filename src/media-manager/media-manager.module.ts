import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';

import { MediaManagerController } from './media-manager.controller';
import { MediaManagerService } from './media-manager.service';
import { MediaServeController } from './media.controller';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './private_uploads',
    }),
  ],
  controllers: [MediaManagerController, MediaServeController],
  providers: [MediaManagerService],
})
export class MediaManagerModule {}
