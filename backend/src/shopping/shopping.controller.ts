import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
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
import { ShoppingService } from './shopping.service';
import {
  CreateShoppingListDto,
  UpdateShoppingListDto,
  CreateShoppingListItemDto,
  UpdateShoppingListItemDto,
  BulkCreateItemsDto,
  GenerateFromRecipeDto,
  GenerateFromMealPlanDto,
  ShoppingListResponse,
  ShoppingListListResponse,
  ShoppingListItemResponse,
  GroupedShoppingListResponse,
} from './dto/shopping-list.dto';

@ApiTags('Shopping Lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shopping-lists')
export class ShoppingController {
  constructor(private readonly shoppingService: ShoppingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shopping list' })
  @ApiResponse({ status: 201, description: 'Shopping list created' })
  async create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateShoppingListDto,
  ): Promise<ShoppingListResponse> {
    return this.shoppingService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shopping lists' })
  @ApiResponse({ status: 200, description: 'List of shopping lists' })
  async findAll(
    @Request() req: { user: { userId: string } },
  ): Promise<ShoppingListListResponse> {
    return this.shoppingService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific shopping list with items grouped by category' })
  @ApiResponse({ status: 200, description: 'Shopping list details' })
  async findOne(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ): Promise<GroupedShoppingListResponse> {
    return this.shoppingService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a shopping list' })
  @ApiResponse({ status: 200, description: 'Shopping list updated' })
  async update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateShoppingListDto,
  ): Promise<ShoppingListResponse> {
    return this.shoppingService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shopping list' })
  @ApiResponse({ status: 200, description: 'Shopping list deleted' })
  async delete(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ): Promise<void> {
    return this.shoppingService.delete(req.user.userId, id);
  }

  // Item operations
  @Post(':id/items')
  @ApiOperation({ summary: 'Add an item to the shopping list' })
  @ApiResponse({ status: 201, description: 'Item added' })
  async addItem(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: CreateShoppingListItemDto,
  ): Promise<ShoppingListItemResponse> {
    return this.shoppingService.addItem(req.user.userId, id, dto);
  }

  @Post(':id/items/bulk')
  @ApiOperation({ summary: 'Add multiple items to the shopping list' })
  @ApiResponse({ status: 201, description: 'Items added' })
  async bulkAddItems(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: BulkCreateItemsDto,
  ): Promise<ShoppingListItemResponse[]> {
    return this.shoppingService.bulkAddItems(req.user.userId, id, dto.items);
  }

  @Put(':id/items/:itemId')
  @ApiOperation({ summary: 'Update an item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  async updateItem(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateShoppingListItemDto,
  ): Promise<ShoppingListItemResponse> {
    return this.shoppingService.updateItem(req.user.userId, id, itemId, dto);
  }

  @Patch(':id/items/:itemId/toggle')
  @ApiOperation({ summary: 'Toggle checked status of an item' })
  @ApiResponse({ status: 200, description: 'Item toggled' })
  async toggleItem(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<ShoppingListItemResponse> {
    return this.shoppingService.toggleItem(req.user.userId, id, itemId);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Delete an item' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  async deleteItem(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    return this.shoppingService.deleteItem(req.user.userId, id, itemId);
  }

  @Delete(':id/items/checked')
  @ApiOperation({ summary: 'Clear all checked items' })
  @ApiResponse({ status: 200, description: 'Checked items cleared' })
  async clearChecked(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ): Promise<void> {
    return this.shoppingService.clearChecked(req.user.userId, id);
  }

  // Generate shopping lists
  @Post('generate/from-recipe')
  @ApiOperation({ summary: 'Generate a shopping list from a recipe' })
  @ApiResponse({ status: 201, description: 'Shopping list generated' })
  async generateFromRecipe(
    @Request() req: { user: { userId: string } },
    @Body() dto: GenerateFromRecipeDto,
  ): Promise<GroupedShoppingListResponse> {
    return this.shoppingService.generateFromRecipe(req.user.userId, dto);
  }

  @Post('generate/from-meal-plan')
  @ApiOperation({ summary: 'Generate a shopping list from a meal plan' })
  @ApiResponse({ status: 201, description: 'Shopping list generated' })
  async generateFromMealPlan(
    @Request() req: { user: { userId: string } },
    @Body() dto: GenerateFromMealPlanDto,
  ): Promise<GroupedShoppingListResponse> {
    return this.shoppingService.generateFromMealPlan(req.user.userId, dto);
  }
}
