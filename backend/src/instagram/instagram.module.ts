import { Module } from '@nestjs/common';
import { InstagramController } from './instagram.controller';
import { InstagramService } from './instagram.service';
import { InstagramApiService } from './instagram-api.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [InstagramController],
  providers: [InstagramService, InstagramApiService],
  exports: [InstagramService],
})
export class InstagramModule {}
