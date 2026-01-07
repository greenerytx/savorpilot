import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Common ingredient categories for grouping
export enum IngredientCategory {
  PRODUCE = 'produce',
  DAIRY = 'dairy',
  MEAT = 'meat',
  SEAFOOD = 'seafood',
  BAKERY = 'bakery',
  FROZEN = 'frozen',
  PANTRY = 'pantry',
  SPICES = 'spices',
  CONDIMENTS = 'condiments',
  BEVERAGES = 'beverages',
  OTHER = 'other',
}

export class CreateShoppingListDto {
  @ApiProperty({ description: 'Name of the shopping list' })
  @IsString()
  name: string;
}

export class UpdateShoppingListDto {
  @ApiPropertyOptional({ description: 'Name of the shopping list' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class CreateShoppingListItemDto {
  @ApiProperty({ description: 'Ingredient name' })
  @IsString()
  ingredient: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit (cups, tbsp, etc.)' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Category for grouping' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Associated recipe ID' })
  @IsOptional()
  @IsUUID()
  recipeId?: string;
}

export class UpdateShoppingListItemDto {
  @ApiPropertyOptional({ description: 'Ingredient name' })
  @IsOptional()
  @IsString()
  ingredient?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Checked status' })
  @IsOptional()
  @IsBoolean()
  isChecked?: boolean;
}

export class BulkCreateItemsDto {
  @ApiProperty({ type: [CreateShoppingListItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShoppingListItemDto)
  items: CreateShoppingListItemDto[];
}

export class GenerateFromRecipeDto {
  @ApiProperty({ description: 'Recipe ID to generate list from' })
  @IsUUID()
  recipeId: string;

  @ApiPropertyOptional({ description: 'Number of servings to scale to' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  servings?: number;

  @ApiPropertyOptional({ description: 'Optional shopping list name' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class GenerateFromMealPlanDto {
  @ApiProperty({ description: 'Meal plan ID to generate list from' })
  @IsUUID()
  mealPlanId: string;

  @ApiPropertyOptional({ description: 'Optional shopping list name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Only include meals after this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Only include meals before this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

// Response types
export class ShoppingListItemResponse {
  id: string;
  ingredient: string;
  quantity?: number;
  unit?: string;
  category?: string;
  isChecked: boolean;
  recipeId?: string;
  recipe?: {
    id: string;
    title: string;
  };
}

export class ShoppingListResponse {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  items?: ShoppingListItemResponse[];
  itemCount?: number;
  checkedCount?: number;
}

export class ShoppingListListResponse {
  data: ShoppingListResponse[];
  total: number;
}

// Grouped items by category
export class GroupedShoppingListResponse extends ShoppingListResponse {
  groupedItems?: Record<string, ShoppingListItemResponse[]>;
}
