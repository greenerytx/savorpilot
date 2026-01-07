import { IsString, IsOptional, IsUUID, IsDateString, MaxLength, IsEnum } from 'class-validator';
import { ChallengeStatus } from '@prisma/client';

export class CreateChallengeDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @MaxLength(100)
  theme: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsDateString()
  votingEndDate: string;
}

export class UpdateChallengeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  theme?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @IsOptional()
  @IsEnum(ChallengeStatus)
  status?: ChallengeStatus;
}

export class CreateEntryDto {
  @IsOptional()
  @IsUUID()
  recipeId?: string;

  @IsString()
  @MaxLength(500)
  photoUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}

export class ChallengeQueryDto {
  @IsOptional()
  @IsEnum(ChallengeStatus)
  status?: ChallengeStatus;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  limit?: number;
}
