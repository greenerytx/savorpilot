import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class IngredientDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  optional?: boolean;
}

class StepDto {
  @IsNumber()
  order: number;

  @IsString()
  instruction: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  tips?: string;
}

class ComponentDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients: IngredientDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepDto)
  steps: StepDto[];
}

export class ImportSinglePostDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  prepTimeMinutes?: number;

  @IsOptional()
  @IsNumber()
  cookTimeMinutes?: number;

  @IsOptional()
  @IsNumber()
  servings?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  components: ComponentDto[];
}

export class BulkImportDto {
  @IsArray()
  @IsString({ each: true })
  postIds: string[];
}

export class BulkImportResponseDto {
  jobId: string;
  status: string;
  totalPosts: number;
  message: string;
}

export class ImportJobStatusDto {
  id: string;
  status: string;
  totalPosts: number;
  processedPosts: number;
  successfulPosts: number;
  failedPosts: number;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class GenerateStepsDto {
  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients: IngredientDto[];
}
