import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { PublicRecipesController } from './public-recipes.controller';
import { RecipesService } from './recipes.service';
import { AllergenMappingService } from './allergen-mapping.service';
import { RecipeCompatibilityService } from './recipe-compatibility.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [RecipesController, PublicRecipesController],
  providers: [RecipesService, AllergenMappingService, RecipeCompatibilityService],
  exports: [RecipesService, AllergenMappingService, RecipeCompatibilityService],
})
export class RecipesModule {}
