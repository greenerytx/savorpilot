import { IsUUID, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class CreateRecipeRequestDto {
  @IsUUID()
  targetId: string;

  @IsOptional()
  @IsUUID()
  recipeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class RecipeRequestResponseDto {
  id: string;
  requesterId: string;
  targetId: string;
  recipeId: string | null;
  message: string | null;
  status: RequestStatus;
  createdAt: Date;
  respondedAt: Date | null;
}

export class RecipeRequestWithUsersDto extends RecipeRequestResponseDto {
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  target: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  recipe?: {
    id: string;
    title: string;
    imageUrl: string | null;
  } | null;
}
