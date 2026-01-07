import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsBoolean,
  IsOptional,
  IsEmail,
  IsString,
  IsArray,
  IsDateString,
} from 'class-validator';

// Share a recipe with a user
export class ShareRecipeDto {
  @ApiProperty({ description: 'Email of user to share with' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Allow recipient to edit the recipe' })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiPropertyOptional({ description: 'Allow recipient to reshare the recipe' })
  @IsBoolean()
  @IsOptional()
  canReshare?: boolean;

  @ApiPropertyOptional({ description: 'Expiration date for the share' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

// Share a recipe group/collection with a user
export class ShareGroupDto {
  @ApiProperty({ description: 'Email of user to share with' })
  @IsEmail()
  email: string;
}

// Bulk share with multiple users
export class BulkShareRecipeDto {
  @ApiProperty({ description: 'Emails of users to share with' })
  @IsArray()
  @IsEmail({}, { each: true })
  emails: string[];

  @ApiPropertyOptional({ description: 'Allow recipients to edit the recipe' })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiPropertyOptional({ description: 'Allow recipients to reshare the recipe' })
  @IsBoolean()
  @IsOptional()
  canReshare?: boolean;
}

// Update share permissions
export class UpdateShareDto {
  @ApiPropertyOptional({ description: 'Allow recipient to edit the recipe' })
  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @ApiPropertyOptional({ description: 'Allow recipient to reshare the recipe' })
  @IsBoolean()
  @IsOptional()
  canReshare?: boolean;

  @ApiPropertyOptional({ description: 'Expiration date for the share' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

// Response DTOs
export class SharedRecipeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  recipeId: string;

  @ApiProperty()
  recipeName: string;

  @ApiProperty()
  recipeImage?: string;

  @ApiProperty()
  sharedByUserId: string;

  @ApiProperty()
  sharedByName: string;

  @ApiProperty()
  sharedWithUserId: string;

  @ApiProperty()
  sharedWithEmail: string;

  @ApiProperty()
  sharedWithName: string;

  @ApiProperty()
  canEdit: boolean;

  @ApiProperty()
  canReshare: boolean;

  @ApiProperty()
  sharedAt: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional()
  viewedAt?: Date;
}

export class SharedGroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  groupName: string;

  @ApiProperty()
  groupCoverImage?: string;

  @ApiProperty()
  sharedByUserId: string;

  @ApiProperty()
  sharedByName: string;

  @ApiProperty()
  sharedWithUserId: string;

  @ApiProperty()
  sharedWithEmail: string;

  @ApiProperty()
  sharedWithName: string;

  @ApiProperty()
  sharedAt: Date;
}

export class SharedSmartCollectionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  collectionId: string;

  @ApiProperty()
  collectionName: string;

  @ApiPropertyOptional()
  collectionIcon?: string;

  @ApiPropertyOptional()
  collectionColor?: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty()
  sharedByUserId: string;

  @ApiProperty()
  sharedByName: string;

  @ApiProperty()
  sharedWithUserId: string;

  @ApiProperty()
  sharedWithEmail: string;

  @ApiProperty()
  sharedWithName: string;

  @ApiProperty()
  sharedAt: Date;
}

export class ShareSummaryDto {
  @ApiProperty()
  totalSharedByMe: number;

  @ApiProperty()
  totalSharedWithMe: number;

  @ApiProperty()
  recentlyShared: SharedRecipeResponseDto[];
}
