import { IsEnum, IsUUID, IsOptional } from 'class-validator';
import { CookingStatusType } from '@prisma/client';

export class UpdateCookingStatusDto {
  @IsEnum(CookingStatusType)
  status: CookingStatusType;

  @IsOptional()
  @IsUUID()
  recipeId?: string;
}

export class CookingStatusResponseDto {
  id: string;
  userId: string;
  recipeId: string | null;
  status: CookingStatusType;
  startedAt: Date | null;
  expiresAt: Date | null;
  updatedAt: Date;
  recipe?: {
    id: string;
    title: string;
    imageUrl: string | null;
  } | null;
}

export class CookingStatusWithUserDto extends CookingStatusResponseDto {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}
