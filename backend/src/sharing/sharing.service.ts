import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ShareRecipeDto,
  ShareGroupDto,
  UpdateShareDto,
  SharedRecipeResponseDto,
  SharedGroupResponseDto,
  SharedSmartCollectionResponseDto,
} from './dto/share.dto';

@Injectable()
export class SharingService {
  private readonly logger = new Logger(SharingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Share a recipe with another user by email
   */
  async shareRecipe(
    recipeId: string,
    userId: string,
    dto: ShareRecipeDto,
  ): Promise<SharedRecipeResponseDto> {
    // Find the recipe and verify ownership
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { user: true },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.userId !== userId) {
      throw new ForbiddenException('You can only share your own recipes');
    }

    // Find the user to share with
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with email ${dto.email} not found`);
    }

    if (targetUser.id === userId) {
      throw new BadRequestException('You cannot share a recipe with yourself');
    }

    // Check if already shared
    const existingShare = await this.prisma.sharedRecipe.findUnique({
      where: {
        recipeId_sharedWithUserId: {
          recipeId,
          sharedWithUserId: targetUser.id,
        },
      },
    });

    if (existingShare) {
      throw new BadRequestException('Recipe is already shared with this user');
    }

    // Create the share
    const share = await this.prisma.sharedRecipe.create({
      data: {
        recipeId,
        sharedByUserId: userId,
        sharedWithUserId: targetUser.id,
        canEdit: dto.canEdit ?? false,
        canReshare: dto.canReshare ?? false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        recipe: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
    });

    this.logger.log(
      `Recipe ${recipeId} shared with ${targetUser.email} by ${userId}`,
    );

    // Create notification for the recipient
    const senderName = `${share.sharedByUser.firstName} ${share.sharedByUser.lastName}`;
    await this.notificationsService.createRecipeSharedNotification(
      targetUser.id,
      senderName,
      share.recipe.title,
      recipeId,
    );

    return this.mapToSharedRecipeResponse(share);
  }

  /**
   * Share a group/collection with another user
   */
  async shareGroup(
    groupId: string,
    userId: string,
    dto: ShareGroupDto,
  ): Promise<SharedGroupResponseDto> {
    // Find the group and verify ownership
    const group = await this.prisma.recipeGroup.findUnique({
      where: { id: groupId },
      include: { user: true },
    });

    if (!group) {
      throw new NotFoundException('Collection not found');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException('You can only share your own collections');
    }

    // Find the user to share with
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with email ${dto.email} not found`);
    }

    if (targetUser.id === userId) {
      throw new BadRequestException(
        'You cannot share a collection with yourself',
      );
    }

    // Check if already shared
    const existingShare = await this.prisma.sharedRecipeGroup.findUnique({
      where: {
        groupId_sharedWithUserId: {
          groupId,
          sharedWithUserId: targetUser.id,
        },
      },
    });

    if (existingShare) {
      throw new BadRequestException(
        'Collection is already shared with this user',
      );
    }

    // Create the share
    const share = await this.prisma.sharedRecipeGroup.create({
      data: {
        groupId,
        sharedByUserId: userId,
        sharedWithUserId: targetUser.id,
      },
      include: {
        group: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
    });

    this.logger.log(
      `Group ${groupId} shared with ${targetUser.email} by ${userId}`,
    );

    // Create notification for the recipient
    const senderName = `${share.sharedByUser.firstName} ${share.sharedByUser.lastName}`;
    await this.notificationsService.createGroupSharedNotification(
      targetUser.id,
      senderName,
      share.group.name,
      groupId,
    );

    return this.mapToSharedGroupResponse(share);
  }

  /**
   * Get recipes shared by the current user
   */
  async getRecipesSharedByMe(userId: string): Promise<SharedRecipeResponseDto[]> {
    const shares = await this.prisma.sharedRecipe.findMany({
      where: { sharedByUserId: userId },
      include: {
        recipe: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return shares.map((s) => this.mapToSharedRecipeResponse(s));
  }

  /**
   * Get recipes shared with the current user
   */
  async getRecipesSharedWithMe(
    userId: string,
  ): Promise<SharedRecipeResponseDto[]> {
    const shares = await this.prisma.sharedRecipe.findMany({
      where: {
        sharedWithUserId: userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        recipe: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return shares.map((s) => this.mapToSharedRecipeResponse(s));
  }

  /**
   * Get groups shared by the current user
   */
  async getGroupsSharedByMe(userId: string): Promise<SharedGroupResponseDto[]> {
    const shares = await this.prisma.sharedRecipeGroup.findMany({
      where: { sharedByUserId: userId },
      include: {
        group: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return shares.map((s) => this.mapToSharedGroupResponse(s));
  }

  /**
   * Get groups shared with the current user
   */
  async getGroupsSharedWithMe(
    userId: string,
  ): Promise<SharedGroupResponseDto[]> {
    const shares = await this.prisma.sharedRecipeGroup.findMany({
      where: { sharedWithUserId: userId },
      include: {
        group: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return shares.map((s) => this.mapToSharedGroupResponse(s));
  }

  /**
   * Get shares for a specific recipe (who it's shared with)
   */
  async getRecipeShares(
    recipeId: string,
    userId: string,
  ): Promise<SharedRecipeResponseDto[]> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.userId !== userId) {
      throw new ForbiddenException('You can only view shares for your own recipes');
    }

    const shares = await this.prisma.sharedRecipe.findMany({
      where: { recipeId },
      include: {
        recipe: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return shares.map((s) => this.mapToSharedRecipeResponse(s));
  }

  /**
   * Get shares for a specific group (who it's shared with)
   */
  async getGroupShares(
    groupId: string,
    userId: string,
  ): Promise<SharedGroupResponseDto[]> {
    const group = await this.prisma.recipeGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Collection not found');
    }

    if (group.userId !== userId) {
      throw new ForbiddenException(
        'You can only view shares for your own collections',
      );
    }

    const shares = await this.prisma.sharedRecipeGroup.findMany({
      where: { groupId },
      include: {
        group: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return shares.map((s) => this.mapToSharedGroupResponse(s));
  }

  /**
   * Update share permissions
   */
  async updateRecipeShare(
    shareId: string,
    userId: string,
    dto: UpdateShareDto,
  ): Promise<SharedRecipeResponseDto> {
    const share = await this.prisma.sharedRecipe.findUnique({
      where: { id: shareId },
      include: { recipe: true },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    if (share.sharedByUserId !== userId) {
      throw new ForbiddenException('You can only update your own shares');
    }

    const updated = await this.prisma.sharedRecipe.update({
      where: { id: shareId },
      data: {
        canEdit: dto.canEdit,
        canReshare: dto.canReshare,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: {
        recipe: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
    });

    return this.mapToSharedRecipeResponse(updated);
  }

  /**
   * Revoke recipe share
   */
  async revokeRecipeShare(shareId: string, userId: string): Promise<void> {
    const share = await this.prisma.sharedRecipe.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    if (share.sharedByUserId !== userId) {
      throw new ForbiddenException('You can only revoke your own shares');
    }

    await this.prisma.sharedRecipe.delete({
      where: { id: shareId },
    });

    this.logger.log(`Share ${shareId} revoked by ${userId}`);
  }

  /**
   * Revoke group share
   */
  async revokeGroupShare(shareId: string, userId: string): Promise<void> {
    const share = await this.prisma.sharedRecipeGroup.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    if (share.sharedByUserId !== userId) {
      throw new ForbiddenException('You can only revoke your own shares');
    }

    await this.prisma.sharedRecipeGroup.delete({
      where: { id: shareId },
    });

    this.logger.log(`Group share ${shareId} revoked by ${userId}`);
  }

  // ==================== SMART COLLECTION SHARING ====================

  /**
   * Share a smart collection with another user
   */
  async shareSmartCollection(
    collectionId: string,
    userId: string,
    dto: ShareGroupDto,
  ): Promise<SharedSmartCollectionResponseDto> {
    // Find the collection and verify ownership
    const collection = await this.prisma.smartCollection.findUnique({
      where: { id: collectionId },
      include: { user: true },
    });

    if (!collection) {
      throw new NotFoundException('Smart collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You can only share your own collections');
    }

    // Find the user to share with
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with email ${dto.email} not found`);
    }

    if (targetUser.id === userId) {
      throw new BadRequestException(
        'You cannot share a collection with yourself',
      );
    }

    // Check if already shared
    const existingShare = await this.prisma.sharedSmartCollection.findUnique({
      where: {
        collectionId_sharedWithUserId: {
          collectionId,
          sharedWithUserId: targetUser.id,
        },
      },
    });

    if (existingShare) {
      throw new BadRequestException(
        'Collection is already shared with this user',
      );
    }

    // Create the share
    const share = await this.prisma.sharedSmartCollection.create({
      data: {
        collectionId,
        sharedByUserId: userId,
        sharedWithUserId: targetUser.id,
      },
      include: {
        collection: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
    });

    this.logger.log(
      `Smart collection ${collectionId} shared with ${targetUser.email} by ${userId}`,
    );

    // Create notification for the recipient
    const senderName = `${share.sharedByUser.firstName} ${share.sharedByUser.lastName}`;
    await this.notificationsService.createGroupSharedNotification(
      targetUser.id,
      senderName,
      share.collection.name,
      collectionId,
    );

    return this.mapToSharedSmartCollectionResponse(share);
  }

  /**
   * Get smart collections shared by the current user
   */
  async getSmartCollectionsSharedByMe(
    userId: string,
  ): Promise<SharedSmartCollectionResponseDto[]> {
    const shares = await this.prisma.sharedSmartCollection.findMany({
      where: { sharedByUserId: userId },
      include: {
        collection: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return shares.map((s) => this.mapToSharedSmartCollectionResponse(s));
  }

  /**
   * Get smart collections shared with the current user
   */
  async getSmartCollectionsSharedWithMe(
    userId: string,
  ): Promise<SharedSmartCollectionResponseDto[]> {
    const shares = await this.prisma.sharedSmartCollection.findMany({
      where: { sharedWithUserId: userId },
      include: {
        collection: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return shares.map((s) => this.mapToSharedSmartCollectionResponse(s));
  }

  /**
   * Get shares for a specific smart collection
   */
  async getSmartCollectionShares(
    collectionId: string,
    userId: string,
  ): Promise<SharedSmartCollectionResponseDto[]> {
    const collection = await this.prisma.smartCollection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      throw new NotFoundException('Smart collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException(
        'You can only view shares for your own collections',
      );
    }

    const shares = await this.prisma.sharedSmartCollection.findMany({
      where: { collectionId },
      include: {
        collection: true,
        sharedByUser: true,
        sharedWithUser: true,
      },
      orderBy: { sharedAt: 'desc' },
    });

    return shares.map((s) => this.mapToSharedSmartCollectionResponse(s));
  }

  /**
   * Revoke smart collection share
   */
  async revokeSmartCollectionShare(
    shareId: string,
    userId: string,
  ): Promise<void> {
    const share = await this.prisma.sharedSmartCollection.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    if (share.sharedByUserId !== userId) {
      throw new ForbiddenException('You can only revoke your own shares');
    }

    await this.prisma.sharedSmartCollection.delete({
      where: { id: shareId },
    });

    this.logger.log(`Smart collection share ${shareId} revoked by ${userId}`);
  }

  /**
   * Mark a shared recipe as viewed
   */
  async markRecipeViewed(recipeId: string, userId: string): Promise<void> {
    await this.prisma.sharedRecipe.updateMany({
      where: {
        recipeId,
        sharedWithUserId: userId,
        viewedAt: null,
      },
      data: {
        viewedAt: new Date(),
      },
    });
  }

  /**
   * Search users by email (for share autocomplete)
   */
  async searchUsers(
    query: string,
    currentUserId: string,
  ): Promise<{ id: string; email: string; name: string }[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        email: { contains: query.toLowerCase(), mode: 'insensitive' },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      take: 10,
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`,
    }));
  }

  // Helper methods
  private mapToSharedRecipeResponse(share: any): SharedRecipeResponseDto {
    return {
      id: share.id,
      recipeId: share.recipeId,
      recipeName: share.recipe.title,
      recipeImage: share.recipe.imageUrl,
      sharedByUserId: share.sharedByUserId,
      sharedByName: `${share.sharedByUser.firstName} ${share.sharedByUser.lastName}`,
      sharedWithUserId: share.sharedWithUserId,
      sharedWithEmail: share.sharedWithUser.email,
      sharedWithName: `${share.sharedWithUser.firstName} ${share.sharedWithUser.lastName}`,
      canEdit: share.canEdit,
      canReshare: share.canReshare,
      sharedAt: share.sharedAt,
      expiresAt: share.expiresAt,
      viewedAt: share.viewedAt,
    };
  }

  private mapToSharedGroupResponse(share: any): SharedGroupResponseDto {
    return {
      id: share.id,
      groupId: share.groupId,
      groupName: share.group.name,
      groupCoverImage: share.group.coverImage,
      sharedByUserId: share.sharedByUserId,
      sharedByName: `${share.sharedByUser.firstName} ${share.sharedByUser.lastName}`,
      sharedWithUserId: share.sharedWithUserId,
      sharedWithEmail: share.sharedWithUser.email,
      sharedWithName: `${share.sharedWithUser.firstName} ${share.sharedWithUser.lastName}`,
      sharedAt: share.sharedAt,
    };
  }

  private mapToSharedSmartCollectionResponse(
    share: any,
  ): SharedSmartCollectionResponseDto {
    return {
      id: share.id,
      collectionId: share.collectionId,
      collectionName: share.collection.name,
      collectionIcon: share.collection.icon,
      collectionColor: share.collection.color,
      isSystem: share.collection.isSystem,
      sharedByUserId: share.sharedByUserId,
      sharedByName: `${share.sharedByUser.firstName} ${share.sharedByUser.lastName}`,
      sharedWithUserId: share.sharedWithUserId,
      sharedWithEmail: share.sharedWithUser.email,
      sharedWithName: `${share.sharedWithUser.firstName} ${share.sharedWithUser.lastName}`,
      sharedAt: share.sharedAt,
    };
  }
}
