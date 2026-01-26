import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaService } from './media.service';

@Module({
  imports: [
    MulterModule.register({
      dest: './private_uploads',
    }),
  ],
  controllers: [],
  providers: [MediaService],
})
export class MediaModule {}
