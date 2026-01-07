import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecipeVisibility } from '@prisma/client';

// Filter rules interface
export class FilterRulesDto {
  @ApiPropertyOptional({
    description: 'Filter by categories',
    example: ['DINNER', 'LUNCH'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiPropertyOptional({
    description: 'Filter by cuisines',
    example: ['Italian', 'Mexican'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisine?: string[];

  @ApiPropertyOptional({
    description: 'Filter by difficulty levels',
    example: ['EASY', 'MEDIUM'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  difficulty?: string[];

  @ApiPropertyOptional({
    description: 'Maximum total cooking time in minutes',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTime?: number;

  @ApiPropertyOptional({
    description: 'Minimum total cooking time in minutes',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minTime?: number;

  @ApiPropertyOptional({
    description: 'Filter by tags (must have all)',
    example: ['vegetarian', 'healthy'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter by recipe source',
    example: ['INSTAGRAM_URL', 'URL'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  source?: string[];

  @ApiPropertyOptional({
    description: 'Only recipes created in last N days',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  recentDays?: number;

  @ApiPropertyOptional({
    description: 'Search text in title/description',
    example: 'chicken',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateSmartCollectionDto {
  @ApiProperty({
    description: 'Name of the smart collection',
    example: 'Quick Weeknight Dinners',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the collection',
    example: 'Easy dinner recipes ready in 30 minutes or less',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Lucide icon name',
    example: 'clock',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Tailwind color name',
    example: 'amber',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Filter rules for auto-populating recipes',
    type: FilterRulesDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => FilterRulesDto)
  filterRules: FilterRulesDto;
}

export class UpdateSmartCollectionDto extends PartialType(CreateSmartCollectionDto) {
  @ApiPropertyOptional({
    description: 'Visibility of the collection',
    enum: RecipeVisibility,
    example: 'PRIVATE',
  })
  @IsOptional()
  @IsEnum(RecipeVisibility)
  visibility?: RecipeVisibility;
}

export class SmartCollectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  icon?: string | null;

  @ApiPropertyOptional()
  color?: string | null;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty({ enum: RecipeVisibility })
  visibility: RecipeVisibility;

  @ApiPropertyOptional()
  sortOrder?: number | null;

  @ApiProperty()
  filterRules: FilterRulesDto;

  @ApiProperty()
  recipeCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SmartCollectionWithRecipesDto extends SmartCollectionResponseDto {
  @ApiProperty({ description: 'Preview of recipes in this collection' })
  recipes: {
    id: string;
    title: string;
    imageUrl?: string | null;
    category?: string | null;
    cuisine?: string | null;
    totalTimeMinutes?: number | null;
    difficulty?: string | null;
    createdAt: Date;
  }[];
}
