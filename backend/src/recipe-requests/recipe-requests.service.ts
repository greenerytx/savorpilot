import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from '@prisma/client';
import {
  RecipeRequestResponseDto,
  RecipeRequestWithUsersDto,
} from './dto/recipe-request.dto';

@Injectable()
export class RecipeRequestsService {
  private readonly REQUEST_EXPIRY_DAYS = 30;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a recipe request
   */
  async createRequest(
    requesterId: string,
    targetId: string,
    recipeId?: string,
    message?: string,
  ): Promise<RecipeRequestWithUsersDto> {
    // Cannot request from yourself
    if (requesterId === targetId) {
      throw new BadRequestException('Cannot request a recipe from yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if recipe exists (if provided)
    if (recipeId) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: recipeId },
      });
      if (!recipe) {
        throw new NotFoundException('Recipe not found');
      }
    }

    // Check for existing pending request
    const existingRequest = await this.prisma.recipeRequest.findFirst({
      where: {
        requesterId,
        targetId,
        recipeId: recipeId || null,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending request for this');
    }

    const request = await this.prisma.recipeRequest.create({
      data: {
        requesterId,
        targetId,
        recipeId,
        message,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });

    return request;
  }

  /**
   * Get incoming requests (requests received by user)
   */
  async getIncomingRequests(
    userId: string,
    status?: RequestStatus,
    page = 1,
    limit = 20,
  ): Promise<{ data: RecipeRequestWithUsersDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = { targetId: userId };

    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      this.prisma.recipeRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          target: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          recipe: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
      }),
      this.prisma.recipeRequest.count({ where }),
    ]);

    return { data: requests, total };
  }

  /**
   * Get outgoing requests (requests made by user)
   */
  async getOutgoingRequests(
    userId: string,
    status?: RequestStatus,
    page = 1,
    limit = 20,
  ): Promise<{ data: RecipeRequestWithUsersDto[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = { requesterId: userId };

    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      this.prisma.recipeRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          target: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          recipe: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
        },
      }),
      this.prisma.recipeRequest.count({ where }),
    ]);

    return { data: requests, total };
  }

  /**
   * Fulfill a request (share a recipe)
   */
  async fulfillRequest(
    requestId: string,
    userId: string,
    sharedRecipeId?: string,
  ): Promise<RecipeRequestWithUsersDto> {
    const request = await this.prisma.recipeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.targetId !== userId) {
      throw new ForbiddenException('You can only fulfill requests sent to you');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been responded to');
    }

    // If a recipe is being shared, verify ownership
    if (sharedRecipeId) {
      const recipe = await this.prisma.recipe.findFirst({
        where: { id: sharedRecipeId, userId },
      });
      if (!recipe) {
        throw new ForbiddenException('You can only share your own recipes');
      }
    }

    const updatedRequest = await this.prisma.recipeRequest.update({
      where: { id: requestId },
      data: {
        status: 'FULFILLED',
        respondedAt: new Date(),
        recipeId: sharedRecipeId || request.recipeId,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  /**
   * Decline a request
   */
  async declineRequest(
    requestId: string,
    userId: string,
  ): Promise<RecipeRequestWithUsersDto> {
    const request = await this.prisma.recipeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.targetId !== userId) {
      throw new ForbiddenException('You can only decline requests sent to you');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('This request has already been responded to');
    }

    const updatedRequest = await this.prisma.recipeRequest.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  /**
   * Cancel an outgoing request
   */
  async cancelRequest(
    requestId: string,
    userId: string,
  ): Promise<void> {
    const request = await this.prisma.recipeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.requesterId !== userId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel pending requests');
    }

    await this.prisma.recipeRequest.delete({
      where: { id: requestId },
    });
  }

  /**
   * Get pending request count for a user
   */
  async getPendingRequestCount(userId: string): Promise<number> {
    return this.prisma.recipeRequest.count({
      where: {
        targetId: userId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Expire old pending requests
   */
  async expireOldRequests(): Promise<number> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - this.REQUEST_EXPIRY_DAYS);

    const result = await this.prisma.recipeRequest.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: expiryDate },
      },
      data: {
        status: 'EXPIRED',
        respondedAt: new Date(),
      },
    });

    return result.count;
  }
}
