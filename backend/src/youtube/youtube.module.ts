import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YouTubeController } from './youtube.controller';
import { YouTubeService } from './youtube.service';
import { YouTubeProcessorService } from './youtube-processor.service';
import { YouTubeAiService } from './youtube-ai.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [YouTubeController],
  providers: [YouTubeService, YouTubeProcessorService, YouTubeAiService],
  exports: [YouTubeService],
})
export class YouTubeModule {}
