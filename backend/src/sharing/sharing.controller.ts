import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SharingService } from './sharing.service';
import {
  ShareRecipeDto,
  ShareGroupDto,
  UpdateShareDto,
  SharedRecipeResponseDto,
  SharedGroupResponseDto,
  SharedSmartCollectionResponseDto,
} from './dto/share.dto';

@ApiTags('Sharing')
@Controller('sharing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  // ============================================
  // RECIPE SHARING
  // ============================================

  @Post('recipes/:recipeId')
  @ApiOperation({ summary: 'Share a recipe with another user' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID to share' })
  @ApiResponse({
    status: 201,
    description: 'Recipe shared successfully',
    type: SharedRecipeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Recipe or user not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to share this recipe' })
  async shareRecipe(
    @Param('recipeId') recipeId: string,
    @Body() dto: ShareRecipeDto,
    @CurrentUser('id') userId: string,
  ): Promise<SharedRecipeResponseDto> {
    return this.sharingService.shareRecipe(recipeId, userId, dto);
  }

  @Get('recipes/:recipeId/shares')
  @ApiOperation({ summary: 'Get all shares for a specific recipe' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  @ApiResponse({
    status: 200,
    description: 'List of shares',
    type: [SharedRecipeResponseDto],
  })
  async getRecipeShares(
    @Param('recipeId') recipeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<SharedRecipeResponseDto[]> {
    return this.sharingService.getRecipeShares(recipeId, userId);
  }

  @Patch('recipes/share/:shareId')
  @ApiOperation({ summary: 'Update share permissions' })
  @ApiParam({ name: 'shareId', description: 'Share ID to update' })
  @ApiResponse({
    status: 200,
    description: 'Share updated',
    type: SharedRecipeResponseDto,
  })
  async updateRecipeShare(
    @Param('shareId') shareId: string,
    @Body() dto: UpdateShareDto,
    @CurrentUser('id') userId: string,
  ): Promise<SharedRecipeResponseDto> {
    return this.sharingService.updateRecipeShare(shareId, userId, dto);
  }

  @Delete('recipes/share/:shareId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a recipe share' })
  @ApiParam({ name: 'shareId', description: 'Share ID to revoke' })
  @ApiResponse({ status: 204, description: 'Share revoked' })
  async revokeRecipeShare(
    @Param('shareId') shareId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.sharingService.revokeRecipeShare(shareId, userId);
  }

  @Get('recipes/by-me')
  @ApiOperation({ summary: 'Get recipes shared by current user' })
  @ApiResponse({
    status: 200,
    description: 'List of recipes shared by me',
    type: [SharedRecipeResponseDto],
  })
  async getRecipesSharedByMe(
    @CurrentUser('id') userId: string,
  ): Promise<SharedRecipeResponseDto[]> {
    return this.sharingService.getRecipesSharedByMe(userId);
  }

  @Get('recipes/with-me')
  @ApiOperation({ summary: 'Get recipes shared with current user' })
  @ApiResponse({
    status: 200,
    description: 'List of recipes shared with me',
    type: [SharedRecipeResponseDto],
  })
  async getRecipesSharedWithMe(
    @CurrentUser('id') userId: string,
  ): Promise<SharedRecipeResponseDto[]> {
    return this.sharingService.getRecipesSharedWithMe(userId);
  }

  // ============================================
  // GROUP/COLLECTION SHARING
  // ============================================

  @Post('groups/:groupId')
  @ApiOperation({ summary: 'Share a collection with another user' })
  @ApiParam({ name: 'groupId', description: 'Collection ID to share' })
  @ApiResponse({
    status: 201,
    description: 'Collection shared successfully',
    type: SharedGroupResponseDto,
  })
  async shareGroup(
    @Param('groupId') groupId: string,
    @Body() dto: ShareGroupDto,
    @CurrentUser('id') userId: string,
  ): Promise<SharedGroupResponseDto> {
    return this.sharingService.shareGroup(groupId, userId, dto);
  }

  @Get('groups/:groupId/shares')
  @ApiOperation({ summary: 'Get all shares for a specific collection' })
  @ApiParam({ name: 'groupId', description: 'Collection ID' })
  @ApiResponse({
    status: 200,
    description: 'List of shares',
    type: [SharedGroupResponseDto],
  })
  async getGroupShares(
    @Param('groupId') groupId: string,
    @CurrentUser('id') userId: string,
  ): Promise<SharedGroupResponseDto[]> {
    return this.sharingService.getGroupShares(groupId, userId);
  }

  @Delete('groups/share/:shareId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a collection share' })
  @ApiParam({ name: 'shareId', description: 'Share ID to revoke' })
  @ApiResponse({ status: 204, description: 'Share revoked' })
  async revokeGroupShare(
    @Param('shareId') shareId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.sharingService.revokeGroupShare(shareId, userId);
  }

  @Get('groups/by-me')
  @ApiOperation({ summary: 'Get collections shared by current user' })
  @ApiResponse({
    status: 200,
    description: 'List of collections shared by me',
    type: [SharedGroupResponseDto],
  })
  async getGroupsSharedByMe(
    @CurrentUser('id') userId: string,
  ): Promise<SharedGroupResponseDto[]> {
    return this.sharingService.getGroupsSharedByMe(userId);
  }

  @Get('groups/with-me')
  @ApiOperation({ summary: 'Get collections shared with current user' })
  @ApiResponse({
    status: 200,
    description: 'List of collections shared with me',
    type: [SharedGroupResponseDto],
  })
  async getGroupsSharedWithMe(
    @CurrentUser('id') userId: string,
  ): Promise<SharedGroupResponseDto[]> {
    return this.sharingService.getGroupsSharedWithMe(userId);
  }

  // ============================================
  // UTILITIES
  // ============================================

  @Get('users/search')
  @ApiOperation({ summary: 'Search users by email for sharing' })
  @ApiQuery({ name: 'q', description: 'Search query (email)' })
  @ApiResponse({
    status: 200,
    description: 'Matching users',
  })
  async searchUsers(
    @Query('q') query: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ id: string; email: string; name: string }[]> {
    return this.sharingService.searchUsers(query, userId);
  }

  @Post('recipes/:recipeId/viewed')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a shared recipe as viewed' })
  @ApiParam({ name: 'recipeId', description: 'Recipe ID' })
  async markRecipeViewed(
    @Param('recipeId') recipeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.sharingService.markRecipeViewed(recipeId, userId);
  }

  // ============================================
  // SMART COLLECTION SHARING
  // ============================================

  @Post('smart-collections/:collectionId')
  @ApiOperation({ summary: 'Share a smart collection with another user' })
  @ApiParam({ name: 'collectionId', description: 'Smart Collection ID to share' })
  @ApiResponse({
    status: 201,
    description: 'Smart collection shared successfully',
    type: SharedSmartCollectionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Collection or user not found' })
  @ApiResponse({ status: 403, description: 'Not authorized to share this collection' })
  async shareSmartCollection(
    @Param('collectionId') collectionId: string,
    @Body() dto: ShareGroupDto,
    @CurrentUser('id') userId: string,
  ): Promise<SharedSmartCollectionResponseDto> {
    return this.sharingService.shareSmartCollection(collectionId, userId, dto);
  }

  @Get('smart-collections/:collectionId/shares')
  @ApiOperation({ summary: 'Get all shares for a specific smart collection' })
  @ApiParam({ name: 'collectionId', description: 'Smart Collection ID' })
  @ApiResponse({
    status: 200,
    description: 'List of shares',
    type: [SharedSmartCollectionResponseDto],
  })
  async getSmartCollectionShares(
    @Param('collectionId') collectionId: string,
    @CurrentUser('id') userId: string,
  ): Promise<SharedSmartCollectionResponseDto[]> {
    return this.sharingService.getSmartCollectionShares(collectionId, userId);
  }

  @Delete('smart-collections/share/:shareId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a smart collection share' })
  @ApiParam({ name: 'shareId', description: 'Share ID to revoke' })
  @ApiResponse({ status: 204, description: 'Share revoked' })
  async revokeSmartCollectionShare(
    @Param('shareId') shareId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.sharingService.revokeSmartCollectionShare(shareId, userId);
  }

  @Get('smart-collections/by-me')
  @ApiOperation({ summary: 'Get smart collections shared by current user' })
  @ApiResponse({
    status: 200,
    description: 'List of smart collections shared by me',
    type: [SharedSmartCollectionResponseDto],
  })
  async getSmartCollectionsSharedByMe(
    @CurrentUser('id') userId: string,
  ): Promise<SharedSmartCollectionResponseDto[]> {
    return this.sharingService.getSmartCollectionsSharedByMe(userId);
  }

  @Get('smart-collections/with-me')
  @ApiOperation({ summary: 'Get smart collections shared with current user' })
  @ApiResponse({
    status: 200,
    description: 'List of smart collections shared with me',
    type: [SharedSmartCollectionResponseDto],
  })
  async getSmartCollectionsSharedWithMe(
    @CurrentUser('id') userId: string,
  ): Promise<SharedSmartCollectionResponseDto[]> {
    return this.sharingService.getSmartCollectionsSharedWithMe(userId);
  }
}
