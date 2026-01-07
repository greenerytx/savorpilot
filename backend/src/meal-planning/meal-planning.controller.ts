import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MealPlanningService } from './meal-planning.service';
import { AiMealPlanService } from './ai-meal-plan.service';
import {
  NutritionAggregationService,
  MealPlanNutritionSummary,
  DailyNutritionSummary,
} from './nutrition-aggregation.service';
import {
  CreateMealPlanDto,
  UpdateMealPlanDto,
  CreateMealPlanEntryDto,
  UpdateMealPlanEntryDto,
  BulkCreateEntriesDto,
  MealPlanQueryDto,
  MealPlanResponse,
  MealPlanListResponse,
  MealPlanEntryResponse,
} from './dto/meal-plan.dto';
import {
  GenerateMealPlanRequestDto,
  GenerateMealPlanResponseDto,
  ApplyGeneratedPlanDto,
  RegenerateMealDto,
  GeneratedMealEntryDto,
} from './dto/generate-meal-plan.dto';

@ApiTags('Meal Planning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meal-plans')
export class MealPlanningController {
  constructor(
    private readonly mealPlanningService: MealPlanningService,
    private readonly nutritionService: NutritionAggregationService,
    private readonly aiMealPlanService: AiMealPlanService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new meal plan' })
  @ApiResponse({ status: 201, description: 'Meal plan created successfully' })
  async create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateMealPlanDto,
  ): Promise<MealPlanResponse> {
    return this.mealPlanningService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all meal plans for the current user' })
  @ApiResponse({ status: 200, description: 'List of meal plans' })
  async findAll(
    @Request() req: { user: { id: string } },
    @Query() query: MealPlanQueryDto,
  ): Promise<MealPlanListResponse> {
    return this.mealPlanningService.findAll(req.user.id, query);
  }

  @Get('week/:weekStart')
  @ApiOperation({ summary: 'Get meal plan for a specific week' })
  @ApiResponse({ status: 200, description: 'Meal plan for the week' })
  async getWeekPlan(
    @Request() req: { user: { id: string } },
    @Param('weekStart') weekStart: string,
  ): Promise<MealPlanResponse | null> {
    return this.mealPlanningService.getWeekPlan(req.user.id, weekStart);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan details' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  async findOne(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<MealPlanResponse> {
    return this.mealPlanningService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  async update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateMealPlanDto,
  ): Promise<MealPlanResponse> {
    return this.mealPlanningService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  async delete(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<void> {
    return this.mealPlanningService.delete(req.user.id, id);
  }

  // Meal entries
  @Post(':id/entries')
  @ApiOperation({ summary: 'Add a meal entry to the plan' })
  @ApiResponse({ status: 201, description: 'Entry added successfully' })
  async addEntry(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: CreateMealPlanEntryDto,
  ): Promise<MealPlanEntryResponse> {
    return this.mealPlanningService.addEntry(req.user.id, id, dto);
  }

  @Post(':id/entries/bulk')
  @ApiOperation({ summary: 'Add multiple meal entries to the plan' })
  @ApiResponse({ status: 201, description: 'Entries added successfully' })
  async bulkAddEntries(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: BulkCreateEntriesDto,
  ): Promise<MealPlanEntryResponse[]> {
    return this.mealPlanningService.bulkAddEntries(req.user.id, id, dto.entries);
  }

  @Put(':id/entries/:entryId')
  @ApiOperation({ summary: 'Update a meal entry' })
  @ApiResponse({ status: 200, description: 'Entry updated successfully' })
  async updateEntry(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateMealPlanEntryDto,
  ): Promise<MealPlanEntryResponse> {
    return this.mealPlanningService.updateEntry(req.user.id, id, entryId, dto);
  }

  @Delete(':id/entries/:entryId')
  @ApiOperation({ summary: 'Delete a meal entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted successfully' })
  async deleteEntry(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('entryId') entryId: string,
  ): Promise<void> {
    return this.mealPlanningService.deleteEntry(req.user.id, id, entryId);
  }

  // Nutrition endpoints
  @Get(':id/nutrition')
  @ApiOperation({ summary: 'Get nutrition summary for a meal plan' })
  @ApiResponse({ status: 200, description: 'Meal plan nutrition summary' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  async getMealPlanNutrition(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ): Promise<MealPlanNutritionSummary> {
    return this.nutritionService.getMealPlanNutrition(req.user.id, id);
  }

  @Get(':id/nutrition/daily/:date')
  @ApiOperation({ summary: 'Get nutrition for a specific day in a meal plan' })
  @ApiResponse({ status: 200, description: 'Daily nutrition summary' })
  @ApiResponse({ status: 404, description: 'Meal plan not found' })
  async getDailyNutrition(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('date') date: string,
  ): Promise<DailyNutritionSummary> {
    return this.nutritionService.getDailyNutrition(req.user.id, id, date);
  }

  // AI Meal Plan Generation endpoints
  @Post('generate')
  @ApiOperation({ summary: 'Generate an AI meal plan preview' })
  @ApiResponse({ status: 201, description: 'Generated meal plan preview', type: GenerateMealPlanResponseDto })
  async generateMealPlan(
    @Request() req: { user: { id: string } },
    @Body() dto: GenerateMealPlanRequestDto,
  ): Promise<GenerateMealPlanResponseDto> {
    return this.aiMealPlanService.generateMealPlan(req.user.id, dto);
  }

  @Post('generate/apply')
  @ApiOperation({ summary: 'Apply a generated meal plan preview to create actual meal entries' })
  @ApiResponse({ status: 201, description: 'Meal plan applied successfully', type: MealPlanResponse })
  async applyGeneratedPlan(
    @Request() req: { user: { id: string } },
    @Body() dto: ApplyGeneratedPlanDto,
  ): Promise<MealPlanResponse> {
    return this.aiMealPlanService.applyGeneratedPlan(req.user.id, dto);
  }

  @Post('generate/regenerate-meal')
  @ApiOperation({ summary: 'Regenerate a single meal in the preview' })
  @ApiResponse({ status: 200, description: 'Meal regenerated successfully', type: GeneratedMealEntryDto })
  async regenerateMeal(
    @Request() req: { user: { id: string } },
    @Body() dto: RegenerateMealDto,
  ): Promise<GeneratedMealEntryDto> {
    return this.aiMealPlanService.regenerateMeal(req.user.id, dto);
  }
}
