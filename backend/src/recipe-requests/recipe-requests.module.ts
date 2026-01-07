import { Module } from '@nestjs/common';
import { RecipeRequestsController } from './recipe-requests.controller';
import { RecipeRequestsService } from './recipe-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecipeRequestsController],
  providers: [RecipeRequestsService],
  exports: [RecipeRequestsService],
})
export class RecipeRequestsModule {}
