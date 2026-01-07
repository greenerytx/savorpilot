import { IsEnum, IsUUID, IsOptional } from 'class-validator';
import { ReactionType } from '@prisma/client';

export class AddReactionDto {
  @IsEnum(ReactionType)
  type: ReactionType;
}

export class ReactionStatsDto {
  recipeId: string;
  counts: {
    fire: number;
    want: number;
    drooling: number;
    madeIt: number;
    total: number;
  };
  userReactions: ReactionType[];
}

export class ReactionResponseDto {
  id: string;
  userId: string;
  recipeId: string;
  type: ReactionType;
  createdAt: Date;
}

export class ReactionUserDto {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export class ReactionWithUserDto extends ReactionResponseDto {
  user: ReactionUserDto;
}
