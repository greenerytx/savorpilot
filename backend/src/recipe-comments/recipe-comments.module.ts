import { Module } from '@nestjs/common';
import { RecipeCommentsController } from './recipe-comments.controller';
import { RecipeCommentsService } from './recipe-comments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [RecipeCommentsController],
  providers: [RecipeCommentsService],
  exports: [RecipeCommentsService],
})
export class RecipeCommentsModule {}
