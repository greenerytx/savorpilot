import { Module } from '@nestjs/common';
import { CookingPostsController } from './cooking-posts.controller';
import { CookingPostsService } from './cooking-posts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CookingPostsController],
  providers: [CookingPostsService],
  exports: [CookingPostsService],
})
export class CookingPostsModule {}
