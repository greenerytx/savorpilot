import { Module } from '@nestjs/common';
import { SocialPostsController } from './social-posts.controller';
import { SocialPostsService } from './social-posts.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialPostsController],
  providers: [SocialPostsService],
  exports: [SocialPostsService],
})
export class SocialPostsModule {}
