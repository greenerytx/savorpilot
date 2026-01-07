import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class ParseRecipeTextDto {
  @ApiProperty({
    description: 'Raw text containing recipe information',
    example: `Creamy Tuscan Chicken Pasta

Ingredients:
- 1 lb chicken breast
- 2 cups penne pasta
- 1 cup sun-dried tomatoes
- 2 cups spinach
- 1 cup heavy cream
- 1/2 cup parmesan cheese

Instructions:
1. Cook pasta according to package directions
2. Season and cook chicken until golden
3. Add sun-dried tomatoes and spinach
4. Pour in cream and simmer
5. Add parmesan and serve over pasta`,
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class ParseRecipeUrlDto {
  @ApiProperty({
    description: 'URL to extract recipe from (Instagram, website, etc.)',
    example: 'https://www.instagram.com/p/ABC123/',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;
}

export class ParsedIngredientDto {
  @ApiProperty({ example: 1 })
  quantity?: number;

  @ApiProperty({ example: 'lb' })
  unit?: string;

  @ApiProperty({ example: 'chicken breast' })
  name: string;

  @ApiPropertyOptional({ example: 'boneless, skinless' })
  notes?: string;

  @ApiProperty({ example: false })
  optional?: boolean;
}

export class ParsedStepDto {
  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'Cook pasta according to package directions' })
  instruction: string;

  @ApiPropertyOptional({ example: 10 })
  duration?: number;

  @ApiPropertyOptional({ example: 'Use salted water for better flavor' })
  tips?: string;
}

export class ParsedComponentDto {
  @ApiProperty({ example: 'Main' })
  name: string;

  @ApiProperty({ type: [ParsedIngredientDto] })
  ingredients: ParsedIngredientDto[];

  @ApiProperty({ type: [ParsedStepDto] })
  steps: ParsedStepDto[];
}

export class ParsedRecipeDto {
  @ApiProperty({ example: 'Creamy Tuscan Chicken Pasta' })
  title: string;

  @ApiPropertyOptional({ example: 'A rich and creamy pasta dish with sun-dried tomatoes and spinach' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  videoUrl?: string;

  @ApiPropertyOptional({ example: 15 })
  prepTimeMinutes?: number;

  @ApiPropertyOptional({ example: 25 })
  cookTimeMinutes?: number;

  @ApiPropertyOptional({ example: 4 })
  servings?: number;

  @ApiPropertyOptional({ example: 'MEDIUM' })
  difficulty?: string;

  @ApiPropertyOptional({ example: 'DINNER' })
  category?: string;

  @ApiPropertyOptional({ example: 'Italian' })
  cuisine?: string;

  @ApiPropertyOptional({ example: ['pasta', 'chicken', 'creamy'] })
  tags?: string[];

  @ApiProperty({ type: [ParsedComponentDto] })
  components: ParsedComponentDto[];

  @ApiPropertyOptional({ description: 'Confidence score from 0-1', example: 0.95 })
  confidence?: number;

  @ApiPropertyOptional({ example: 'https://example.com/recipe' })
  sourceUrl?: string;

  @ApiPropertyOptional({ example: 'Chef John' })
  sourceAuthor?: string;
}
