import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';

// Matches Prisma enums
export enum SeasoningDimension {
  SALT = 'SALT',
  ACID = 'ACID',
  HEAT = 'HEAT',
  SWEET = 'SWEET',
  UMAMI = 'UMAMI',
  BITTER = 'BITTER',
}

export enum SeasoningLevel {
  TOO_LITTLE = 'TOO_LITTLE',
  PERFECT = 'PERFECT',
  TOO_MUCH = 'TOO_MUCH',
}

export class CreateSeasoningFeedbackDto {
  @IsUUID()
  recipeId: string;

  @IsInt()
  @Min(0)
  stepIndex: number;

  @IsEnum(SeasoningDimension)
  dimension: SeasoningDimension;

  @IsEnum(SeasoningLevel)
  feedback: SeasoningLevel;
}

export class SeasoningFeedbackResponseDto {
  id: string;
  userId: string;
  recipeId: string;
  stepIndex: number;
  dimension: SeasoningDimension;
  feedback: SeasoningLevel;
  createdAt: Date;
}

export class UserSeasoningPreferencesDto {
  userId: string;
  preferences: {
    dimension: SeasoningDimension;
    preference: number; // 0.0 (low) to 1.0 (high)
    confidence: number; // 0.0 to 1.0 based on data points
    dataPoints: number;
  }[];
  summary: {
    likesItSalty: boolean;
    likesItSpicy: boolean;
    likesItSour: boolean;
    likesItSweet: boolean;
  };
}
