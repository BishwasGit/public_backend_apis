import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  imports: [ConfigModule],
  providers: [VideoService],
  controllers: [VideoController],
})
export class VideoModule {}
