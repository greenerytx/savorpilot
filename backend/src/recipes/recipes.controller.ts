import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { RecipeCompatibilityService } from './recipe-compatibility.service';
import {
  CreateRecipeDto,
  UpdateRecipeDto,
  RecipeQueryDto,
  RecipeResponseDto,
  PaginatedRecipesDto,
  ForkRecipeDto,
  RecipeLineageDto,
  RecipeDiffDto,
  UpdateVisibilityDto,
  BulkUpdateVisibilityDto,
  CompatibleRecipesQueryDto,
} from './dto/recipe.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Recipes')
@ApiBearerAuth()
@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly compatibilityService: RecipeCompatibilityService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recipe' })
  @ApiResponse({ status: 201, type: RecipeResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recipes for current user' })
  @ApiResponse({ status: 200, type: PaginatedRecipesDto })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: RecipeQueryDto,
  ): Promise<PaginatedRecipesDto> {
    return this.recipesService.findAll(userId, query);
  }

  @Get('shared')
  @ApiOperation({ summary: 'Get recipes shared with current user' })
  @ApiResponse({ status: 200, type: PaginatedRecipesDto })
  async findSharedWithMe(
    @CurrentUser('id') userId: string,
    @Query() query: RecipeQueryDto,
  ): Promise<PaginatedRecipesDto> {
    return this.recipesService.findSharedWithMe(userId, query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get recipe statistics for current user' })
  @ApiResponse({ status: 200 })
  async getStatistics(@CurrentUser('id') userId: string) {
    return this.recipesService.getStatistics(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recipe by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: RecipeResponseDto })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
  ): Promise<RecipeResponseDto> {
    return this.recipesService.findOne(userId, recipeId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a recipe (full update)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: RecipeResponseDto })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipesService.update(userId, recipeId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a recipe' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: RecipeResponseDto })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async partialUpdate(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipesService.update(userId, recipeId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a recipe' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Recipe deleted' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
  ): Promise<void> {
    return this.recipesService.remove(userId, recipeId);
  }

  @Patch(':id/notes')
  @ApiOperation({ summary: 'Update recipe notes' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: RecipeResponseDto })
  async updateNotes(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
    @Body() dto: { personalNotes?: string; sharedNotes?: string },
  ): Promise<RecipeResponseDto> {
    return this.recipesService.updateNotes(
      userId,
      recipeId,
      dto.personalNotes,
      dto.sharedNotes,
    );
  }

  @Post(':id/translate')
  @ApiOperation({ summary: 'Translate recipe to English and Arabic' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Recipe translated successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async translateRecipe(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
  ) {
    return this.recipesService.translateRecipe(userId, recipeId);
  }

  @Get(':id/translations')
  @ApiOperation({ summary: 'Get recipe translations' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Recipe translations' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async getTranslations(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
  ) {
    return this.recipesService.getTranslations(userId, recipeId);
  }

  // ==================== VISIBILITY ENDPOINTS ====================

  @Patch(':id/visibility')
  @ApiOperation({ summary: 'Update recipe visibility (PRIVATE/FOLLOWERS/PUBLIC)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: RecipeResponseDto })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async updateVisibility(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
    @Body() dto: UpdateVisibilityDto,
  ): Promise<RecipeResponseDto> {
    return this.recipesService.updateVisibility(userId, recipeId, dto.visibility);
  }

  @Patch('bulk/visibility')
  @ApiOperation({ summary: 'Bulk update recipe visibility' })
  @ApiResponse({ status: 200, description: 'Visibility updated for matching recipes' })
  @ApiResponse({ status: 403, description: 'Not authorized for one or more recipes' })
  async bulkUpdateVisibility(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkUpdateVisibilityDto,
  ): Promise<{ updated: number; failed: string[] }> {
    return this.recipesService.bulkUpdateVisibility(userId, dto.recipeIds, dto.visibility);
  }

  // ==================== FORKING ENDPOINTS ====================

  @Post(':id/fork')
  @ApiOperation({ summary: 'Fork a recipe to create your own copy' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, type: RecipeResponseDto, description: 'Recipe forked successfully' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to fork this recipe' })
  async forkRecipe(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
    @Body() dto: ForkRecipeDto,
  ): Promise<RecipeResponseDto> {
    return this.recipesService.forkRecipe(userId, recipeId, dto);
  }

  @Get(':id/forks')
  @ApiOperation({ summary: 'Get all forks of a recipe' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of recipe forks' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async getRecipeForks(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.recipesService.getRecipeForks(userId, recipeId, { page, limit });
  }

  @Get(':id/lineage')
  @ApiOperation({ summary: 'Get recipe lineage (ancestors and forks)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: RecipeLineageDto, description: 'Recipe lineage tree' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async getRecipeLineage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
  ): Promise<RecipeLineageDto> {
    return this.recipesService.getRecipeLineage(userId, recipeId);
  }

  @Get(':id/compare/:otherId')
  @ApiOperation({ summary: 'Compare two recipes and get diff' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Original recipe ID' })
  @ApiParam({ name: 'otherId', type: 'string', format: 'uuid', description: 'Modified recipe ID' })
  @ApiResponse({ status: 200, type: RecipeDiffDto, description: 'Diff between two recipes' })
  @ApiResponse({ status: 404, description: 'One or both recipes not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to compare these recipes' })
  async compareRecipes(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId1: string,
    @Param('otherId', ParseUUIDPipe) recipeId2: string,
  ): Promise<RecipeDiffDto> {
    return this.recipesService.compareRecipes(userId, recipeId1, recipeId2);
  }

  // ==================== CIRCLE COMPATIBILITY ENDPOINTS ====================

  @Get('circle/:circleId/compatible')
  @ApiOperation({ summary: 'Get recipes compatible with a dinner circle' })
  @ApiParam({ name: 'circleId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of compatible recipes' })
  @ApiResponse({ status: 404, description: 'Circle not found' })
  async getCompatibleRecipes(
    @CurrentUser('id') userId: string,
    @Param('circleId', ParseUUIDPipe) circleId: string,
    @Query() query: CompatibleRecipesQueryDto,
  ) {
    return this.compatibilityService.getCompatibleRecipes(userId, circleId, query);
  }

  @Get(':id/compatibility/:circleId')
  @ApiOperation({ summary: 'Check recipe compatibility with a dinner circle' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Recipe ID' })
  @ApiParam({ name: 'circleId', type: 'string', format: 'uuid', description: 'Circle ID' })
  @ApiResponse({ status: 200, description: 'Compatibility report' })
  @ApiResponse({ status: 404, description: 'Recipe or circle not found' })
  async checkCompatibility(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
    @Param('circleId', ParseUUIDPipe) circleId: string,
  ) {
    return this.compatibilityService.checkRecipeCompatibility(userId, recipeId, circleId);
  }

  @Get(':id/allergens')
  @ApiOperation({ summary: 'Analyze recipe for allergens and dietary restrictions' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detected allergens and restriction violations' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async analyzeAllergens(
    @Param('id', ParseUUIDPipe) recipeId: string,
  ) {
    return this.compatibilityService.analyzeRecipe(recipeId);
  }

  @Get(':id/personal-compatibility')
  @ApiOperation({ summary: 'Check recipe compatibility with current user dietary preferences' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Personal compatibility report' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async checkPersonalCompatibility(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) recipeId: string,
  ) {
    return this.compatibilityService.checkPersonalCompatibility(userId, recipeId);
  }

  @Post('batch-compatibility/:circleId')
  @ApiOperation({ summary: 'Batch check compatibility for multiple recipes' })
  @ApiParam({ name: 'circleId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Map of recipe IDs to compatibility status' })
  async batchCheckCompatibility(
    @CurrentUser('id') userId: string,
    @Param('circleId', ParseUUIDPipe) circleId: string,
    @Body() body: { recipeIds: string[] },
  ) {
    const results = await this.compatibilityService.batchCheckCompatibility(
      userId,
      body.recipeIds,
      circleId,
    );
    // Convert Map to object for JSON serialization
    return Object.fromEntries(results);
  }
}
