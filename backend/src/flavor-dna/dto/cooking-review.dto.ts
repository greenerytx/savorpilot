import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

// Review tags that users can apply
export const REVIEW_TAGS = [
  'too_salty',
  'too_spicy',
  'too_sweet',
  'too_bland',
  'perfect_flavor',
  'quick_easy',
  'time_consuming',
  'kids_approved',
  'date_night',
  'meal_prep_friendly',
  'great_leftovers',
  'impressive_presentation',
  'budget_friendly',
  'healthy',
  'comfort_food',
  'will_modify',
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];

export class CreateCookingReviewDto {
  @IsUUID()
  recipeId: string;

  @IsInt()
  @Min(1)
  @Max(4)
  rating: number; // 1=😕, 2=😐, 3=🙂, 4=😍

  @IsOptional()
  @IsBoolean()
  wouldMakeAgain?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateCookingReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  wouldMakeAgain?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class CookingReviewResponseDto {
  id: string;
  userId: string;
  recipeId: string;
  rating: number;
  ratingEmoji: string; // 😕 😐 🙂 😍
  wouldMakeAgain?: boolean;
  tags: string[];
  notes?: string;
  photoUrl?: string;
  cookedAt: Date;
}

export class RecipeReviewStatsDto {
  recipeId: string;
  totalReviews: number;
  averageRating: number;
  wouldMakeAgainPercent: number;
  ratingDistribution: {
    rating1: number;
    rating2: number;
    rating3: number;
    rating4: number;
  };
  topTags: { tag: string; count: number }[];
}
