import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { RecipeVisibility } from '@prisma/client';
import { IsArray, IsOptional, IsNumber, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ParseRecipeTextDto,
  ParseRecipeUrlDto,
  ParsedRecipeDto,
} from './dto/parse-recipe.dto';
import {
  RecipeChatRequestDto,
  RecipeChatResponseDto,
} from './dto/recipe-chat.dto';

class GenerateRecipePreferencesDto {
  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietary?: string[];

  @IsOptional()
  @IsString()
  mealType?: string;
}

class FusionRecipeDto {
  @IsString()
  recipe1Id: string;

  @IsString()
  recipe2Id: string;

  @IsOptional()
  @IsString()
  fusionStyle?: string; // e.g., "balanced", "recipe1-dominant", "recipe2-dominant", "experimental"
}

class GenerateRecipeDto {
  @IsArray()
  @IsString({ each: true })
  ingredients: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GenerateRecipePreferencesDto)
  preferences?: GenerateRecipePreferencesDto;
}

class IngredientDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsString()
  name: string;
}

class EstimateNutritionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  @ArrayMinSize(1)
  ingredients: IngredientDto[];

  @IsOptional()
  @IsNumber()
  servings?: number;
}

class NutritionEstimate {
  caloriesPerServing: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
}

class SavedNutritionResponse {
  id: string;
  recipeId: string;
  caloriesPerServing: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  sugarGrams: number | null;
  sodiumMg: number | null;
  saturatedFatGrams: number | null;
  cholesterolMg: number | null;
  isEstimated: boolean;
}

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('parse-text')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Parse recipe from text',
    description: 'Uses AI to extract structured recipe data from raw text',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully parsed',
    type: ParsedRecipeDto,
  })
  @ApiResponse({ status: 400, description: 'Failed to parse recipe' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async parseRecipeFromText(
    @Body() dto: ParseRecipeTextDto,
  ): Promise<ParsedRecipeDto> {
    return this.aiService.parseRecipeFromText(dto.text);
  }

  @Post('parse-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extract recipe from URL',
    description: 'Uses AI to extract structured recipe data from a website or Instagram post',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully extracted',
    type: ParsedRecipeDto,
  })
  @ApiResponse({ status: 400, description: 'Failed to extract recipe' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async parseRecipeFromUrl(
    @Body() dto: ParseRecipeUrlDto,
  ): Promise<ParsedRecipeDto> {
    return this.aiService.parseRecipeFromUrl(dto.url);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate recipe from ingredients',
    description: 'Uses AI to create a new recipe based on available ingredients',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully generated',
    type: ParsedRecipeDto,
  })
  @ApiResponse({ status: 400, description: 'Failed to generate recipe' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateRecipe(
    @Body() dto: GenerateRecipeDto,
  ): Promise<ParsedRecipeDto> {
    return this.aiService.generateRecipeFromIngredients(
      dto.ingredients,
      dto.preferences,
    );
  }

  @Post('parse-image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Parse recipe from image',
    description: 'Uses AI Vision to extract recipe data from an uploaded image (photo of recipe, cookbook page, handwritten recipe, etc.)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP)',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe successfully parsed from image',
    type: ParsedRecipeDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid image or failed to parse' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async parseRecipeFromImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ParsedRecipeDto> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Supported: JPEG, PNG, WebP, GIF');
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 20MB');
    }

    return this.aiService.parseRecipeFromImage(file.buffer, file.mimetype);
  }

  @Post('estimate-nutrition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estimate nutrition for ingredients',
    description: 'Uses AI to estimate nutritional content based on recipe ingredients',
  })
  @ApiResponse({
    status: 200,
    description: 'Nutrition successfully estimated',
  })
  @ApiResponse({ status: 400, description: 'Failed to estimate nutrition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async estimateNutrition(
    @Body() dto: EstimateNutritionDto,
  ): Promise<NutritionEstimate> {
    return this.aiService.estimateNutrition(dto.ingredients, dto.servings);
  }

  @Post('estimate-nutrition/:recipeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estimate and save nutrition for a recipe',
    description: 'Uses AI to estimate nutritional content and saves it to the recipe',
  })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID to estimate nutrition for' })
  @ApiResponse({
    status: 200,
    description: 'Nutrition estimated and saved',
    type: SavedNutritionResponse,
  })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async estimateAndSaveNutrition(
    @Param('recipeId') recipeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<SavedNutritionResponse> {
    // Fetch the recipe
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const components = recipe.components as any[];
    if (!components || components.length === 0) {
      throw new BadRequestException('Recipe has no ingredients');
    }

    // Extract all ingredients from all components
    const allIngredients: { quantity?: number; unit?: string; name: string }[] = [];
    for (const component of components) {
      if (component.ingredients && Array.isArray(component.ingredients)) {
        for (const ing of component.ingredients) {
          if (ing.name) {
            allIngredients.push({
              quantity: ing.quantity,
              unit: ing.unit,
              name: ing.name,
            });
          }
        }
      }
    }

    if (allIngredients.length === 0) {
      throw new BadRequestException('No ingredients found in recipe');
    }

    // Estimate nutrition with per-ingredient breakdown
    const { totals, breakdown } = await this.aiService.estimateNutritionWithBreakdown(
      allIngredients,
      recipe.servings || 4,
    );

    // Upsert to RecipeNutrition table with breakdown
    const saved = await this.prisma.recipeNutrition.upsert({
      where: { recipeId },
      create: {
        recipeId,
        caloriesPerServing: totals.caloriesPerServing,
        proteinGrams: totals.proteinGrams,
        carbsGrams: totals.carbsGrams,
        fatGrams: totals.fatGrams,
        fiberGrams: totals.fiberGrams,
        sugarGrams: totals.sugarGrams,
        sodiumMg: totals.sodiumMg,
        isEstimated: true,
        ingredientBreakdown: breakdown,
      },
      update: {
        caloriesPerServing: totals.caloriesPerServing,
        proteinGrams: totals.proteinGrams,
        carbsGrams: totals.carbsGrams,
        fatGrams: totals.fatGrams,
        fiberGrams: totals.fiberGrams,
        sugarGrams: totals.sugarGrams,
        sodiumMg: totals.sodiumMg,
        isEstimated: true,
        ingredientBreakdown: breakdown,
      },
    });

    return saved;
  }

  @Post('generate-steps/:recipeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate detailed cooking steps for a recipe',
    description: 'Uses AI to expand brief step headers into detailed cooking instructions',
  })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID to generate steps for' })
  @ApiResponse({
    status: 200,
    description: 'Steps successfully generated and recipe updated',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateSteps(
    @Param('recipeId') recipeId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Fetch the recipe
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const components = recipe.components as any[];
    if (!components || components.length === 0) {
      throw new BadRequestException('Recipe has no components');
    }

    // Process each component
    const updatedComponents = await Promise.all(
      components.map(async (component) => {
        const ingredients = component.ingredients || [];
        const existingSteps = component.steps || [];

        let result: { steps: { order: number; instruction: string; duration?: number; tips?: string }[] };

        if (existingSteps.length === 0) {
          // No existing steps - generate from ingredients
          result = await this.aiService.generateStepsFromIngredients(
            recipe.title,
            ingredients,
          );
        } else {
          // Expand existing step headers into detailed instructions
          result = await this.aiService.generateDetailedSteps(
            recipe.title,
            ingredients,
            existingSteps,
          );
        }

        return {
          ...component,
          steps: result.steps,
          aiGeneratedSteps: true,
          aiGeneratedStepsAt: new Date().toISOString(),
        };
      }),
    );

    // Update the recipe with new steps
    const updated = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        components: updatedComponents,
      },
    });

    return updated;
  }

  @Post('chat/:recipeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chat with AI about a specific recipe',
    description: 'Ask cooking questions about a recipe. The AI has full context of the recipe and will only answer questions related to cooking it.',
  })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID to chat about' })
  @ApiResponse({
    status: 200,
    description: 'AI response to the cooking question',
    type: RecipeChatResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async recipeChat(
    @Param('recipeId') recipeId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RecipeChatRequestDto,
  ): Promise<RecipeChatResponseDto> {
    // Fetch the recipe (must be owned by user or public)
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        id: recipeId,
        OR: [
          { userId },
          { visibility: RecipeVisibility.PUBLIC },
        ],
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const components = recipe.components as any[];
    if (!components || components.length === 0) {
      throw new BadRequestException('Recipe has no components');
    }

    // Call the AI service with recipe context
    const response = await this.aiService.recipeChat(
      {
        title: recipe.title,
        description: recipe.description || undefined,
        servings: recipe.servings || undefined,
        prepTimeMinutes: recipe.prepTimeMinutes || undefined,
        cookTimeMinutes: recipe.cookTimeMinutes || undefined,
        components,
      },
      dto.message,
      dto.conversationHistory?.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })) || [],
    );

    return response;
  }

  @Post('generate-image/:recipeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate an AI image for a recipe',
    description: 'Uses DALL-E to generate a professional food photography image for a recipe',
  })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID to generate image for' })
  @ApiResponse({
    status: 200,
    description: 'Image successfully generated and recipe updated',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateImage(
    @Param('recipeId') recipeId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Fetch the recipe
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Extract ingredient names from recipe components
    const components = recipe.components as any[];
    const ingredients: string[] = [];
    if (components && components.length > 0) {
      for (const comp of components) {
        if (comp.ingredients && Array.isArray(comp.ingredients)) {
          for (const ing of comp.ingredients) {
            if (ing.name) {
              ingredients.push(ing.name);
            }
          }
        }
      }
    }

    // Generate the image
    const result = await this.aiService.generateRecipeImage(
      recipe.title,
      recipe.description || undefined,
      recipe.cuisine || undefined,
      recipe.category || undefined,
      ingredients.length > 0 ? ingredients : undefined,
    );

    // Update recipe with the new image URL
    const updated = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        imageUrl: result.imageUrl,
        // Mark as AI-generated image for future reference
      },
    });

    return {
      success: true,
      imageUrl: result.imageUrl,
      recipe: updated,
    };
  }

  @Post('remove-image/:recipeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove the image from a recipe',
    description: 'Removes the image URL from a recipe',
  })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID to remove image from' })
  @ApiResponse({
    status: 200,
    description: 'Image successfully removed',
  })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeImage(
    @Param('recipeId') recipeId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Fetch the recipe
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, userId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Remove the image
    const updated = await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        imageUrl: null,
      },
    });

    return {
      success: true,
      recipe: updated,
    };
  }

  @Post('fusion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a fusion recipe from two recipes',
    description: 'Uses AI to merge two recipes into a creative fusion dish, combining techniques, flavors, and ingredients from both',
  })
  @ApiResponse({
    status: 200,
    description: 'Fusion recipe successfully created',
    type: ParsedRecipeDto,
  })
  @ApiResponse({ status: 400, description: 'Failed to create fusion recipe' })
  @ApiResponse({ status: 404, description: 'One or both recipes not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createFusionRecipe(
    @Body() dto: FusionRecipeDto,
    @CurrentUser('id') userId: string,
  ): Promise<ParsedRecipeDto> {
    // Fetch both recipes
    const [recipe1, recipe2] = await Promise.all([
      this.prisma.recipe.findFirst({
        where: {
          id: dto.recipe1Id,
          OR: [
            { userId },
            { visibility: RecipeVisibility.PUBLIC },
          ],
        },
      }),
      this.prisma.recipe.findFirst({
        where: {
          id: dto.recipe2Id,
          OR: [
            { userId },
            { visibility: RecipeVisibility.PUBLIC },
          ],
        },
      }),
    ]);

    if (!recipe1) {
      throw new NotFoundException(`Recipe 1 not found: ${dto.recipe1Id}`);
    }
    if (!recipe2) {
      throw new NotFoundException(`Recipe 2 not found: ${dto.recipe2Id}`);
    }

    return this.aiService.createFusionRecipe(
      {
        title: recipe1.title,
        description: recipe1.description || undefined,
        cuisine: recipe1.cuisine || undefined,
        category: recipe1.category || undefined,
        components: recipe1.components as any[],
      },
      {
        title: recipe2.title,
        description: recipe2.description || undefined,
        cuisine: recipe2.cuisine || undefined,
        category: recipe2.category || undefined,
        components: recipe2.components as any[],
      },
      dto.fusionStyle,
    );
  }

  @Post('ingredient-density')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get ingredient density',
    description: 'Get the density (grams per cup) and type for an ingredient using AI',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ingredientName'],
      properties: {
        ingredientName: {
          type: 'string',
          example: 'quinoa flour',
          description: 'The name of the ingredient to look up',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ingredient density information',
    schema: {
      type: 'object',
      properties: {
        gramsPerCup: { type: 'number', example: 120 },
        type: { type: 'string', enum: ['dry', 'wet', 'fat', 'powder'], example: 'dry' },
        confidence: { type: 'number', example: 0.85 },
      },
    },
  })
  async getIngredientDensity(
    @Body('ingredientName') ingredientName: string,
  ): Promise<{ gramsPerCup: number; type: 'dry' | 'wet' | 'fat' | 'powder'; confidence: number }> {
    if (!ingredientName || typeof ingredientName !== 'string') {
      throw new BadRequestException('ingredientName is required');
    }

    return this.aiService.getIngredientDensity(ingredientName.trim());
  }
}
