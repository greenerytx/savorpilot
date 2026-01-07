import { Module } from '@nestjs/common';
import { RecipeReactionsController } from './recipe-reactions.controller';
import { RecipeReactionsService } from './recipe-reactions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecipeReactionsController],
  providers: [RecipeReactionsService],
  exports: [RecipeReactionsService],
})
export class RecipeReactionsModule {}
