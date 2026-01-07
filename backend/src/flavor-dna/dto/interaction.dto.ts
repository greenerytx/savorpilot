import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsObject,
} from 'class-validator';

// Matches Prisma enum
export enum InteractionType {
  VIEW = 'VIEW',
  SAVE = 'SAVE',
  UNSAVE = 'UNSAVE',
  COOK_START = 'COOK_START',
  COOK_COMPLETE = 'COOK_COMPLETE',
  PRINT = 'PRINT',
  SHARE = 'SHARE',
  FORK = 'FORK',
}

export class TrackInteractionDto {
  @IsUUID()
  recipeId: string;

  @IsEnum(InteractionType)
  type: InteractionType;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number; // seconds spent on page

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>; // scroll depth, source, etc.
}

export class InteractionResponseDto {
  id: string;
  userId: string;
  recipeId: string;
  type: InteractionType;
  duration?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export class InteractionStatsDto {
  recipeId: string;
  viewCount: number;
  saveCount: number;
  cookCount: number;
  shareCount: number;
  forkCount: number;
  avgViewDuration?: number;
}

export class UserEngagementDto {
  userId: string;
  totalInteractions: number;
  recipesViewed: number;
  recipesCooked: number;
  recipesSaved: number;
  avgCookTime?: number;
  mostViewedCuisines: { cuisine: string; count: number }[];
  mostCookedCategories: { category: string; count: number }[];
}
