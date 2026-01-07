import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDinnerCircleDto,
  UpdateDinnerCircleDto,
  CreateMemberDto,
  UpdateMemberDto,
  DinnerCircleResponseDto,
  MemberResponseDto,
} from './dto/dinner-circle.dto';

@Injectable()
export class DinnerCirclesService {
  private readonly logger = new Logger(DinnerCirclesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CIRCLES ====================

  async createCircle(
    userId: string,
    dto: CreateDinnerCircleDto,
  ): Promise<DinnerCircleResponseDto> {
    const circle = await this.prisma.dinnerCircle.create({
      data: {
        name: dto.name,
        description: dto.description,
        emoji: dto.emoji || '👨‍👩‍👧‍👦',
        ownerId: userId,
        members: {
          // Auto-add the creator as an owner member
          create: {
            userId: userId,
            name: 'You', // Will be updated with user's name
            role: 'owner',
            isVirtual: false,
          },
        },
      },
      include: {
        members: true,
        _count: { select: { members: true } },
      },
    });

    // Update the owner member with their actual name
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    if (user) {
      const ownerMember = circle.members.find((m) => m.userId === userId);
      if (ownerMember) {
        await this.prisma.dinnerCircleMember.update({
          where: { id: ownerMember.id },
          data: { name: `${user.firstName} ${user.lastName}`.trim() },
        });
      }
    }

    return this.mapCircleToResponse(circle);
  }

  async getUserCircles(userId: string): Promise<DinnerCircleResponseDto[]> {
    // Get circles where user is owner OR a member
    const circles = await this.prisma.dinnerCircle.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } },
        ],
      },
      include: {
        members: true,
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return circles.map((c) => this.mapCircleToResponse(c));
  }

  async getCircle(
    userId: string,
    circleId: string,
  ): Promise<DinnerCircleResponseDto> {
    const circle = await this.prisma.dinnerCircle.findUnique({
      where: { id: circleId },
      include: {
        members: { orderBy: { createdAt: 'asc' } },
        _count: { select: { members: true } },
      },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    // Check access
    const hasAccess = await this.checkCircleAccess(userId, circleId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this circle');
    }

    return this.mapCircleToResponse(circle);
  }

  async updateCircle(
    userId: string,
    circleId: string,
    dto: UpdateDinnerCircleDto,
  ): Promise<DinnerCircleResponseDto> {
    const circle = await this.prisma.dinnerCircle.findUnique({
      where: { id: circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    // Only owner or admin can update
    const canModify = await this.canModifyCircle(userId, circleId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to modify this circle');
    }

    const updated = await this.prisma.dinnerCircle.update({
      where: { id: circleId },
      data: {
        name: dto.name,
        description: dto.description,
        emoji: dto.emoji,
      },
      include: {
        members: true,
        _count: { select: { members: true } },
      },
    });

    return this.mapCircleToResponse(updated);
  }

  async deleteCircle(userId: string, circleId: string): Promise<void> {
    const circle = await this.prisma.dinnerCircle.findUnique({
      where: { id: circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    // Only owner can delete
    if (circle.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete this circle');
    }

    await this.prisma.dinnerCircle.delete({
      where: { id: circleId },
    });
  }

  // ==================== MEMBERS ====================

  async addMember(
    userId: string,
    circleId: string,
    dto: CreateMemberDto,
  ): Promise<MemberResponseDto> {
    // Check access
    const canModify = await this.canModifyCircle(userId, circleId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to add members');
    }

    // If adding a real user, check they're not already a member
    if (dto.userId) {
      const existingMember = await this.prisma.dinnerCircleMember.findFirst({
        where: { circleId, userId: dto.userId },
      });

      if (existingMember) {
        throw new BadRequestException('User is already a member');
      }

      // Verify the user exists
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const member = await this.prisma.dinnerCircleMember.create({
      data: {
        circleId,
        userId: dto.userId,
        name: dto.name,
        isVirtual: dto.isVirtual ?? !dto.userId,
        role: dto.role || 'member',
        avatarEmoji: dto.avatarEmoji,
        dietaryNotes: dto.dietaryNotes,
        restrictions: dto.restrictions || [],
        allergens: dto.allergens || [],
        preferences: dto.preferences,
      },
    });

    return this.mapMemberToResponse(member);
  }

  async updateMember(
    userId: string,
    circleId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<MemberResponseDto> {
    // Check access
    const canModify = await this.canModifyCircle(userId, circleId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to modify members');
    }

    const member = await this.prisma.dinnerCircleMember.findFirst({
      where: { id: memberId, circleId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Can't change owner's role
    if (member.role === 'owner' && dto.role && dto.role !== 'owner') {
      throw new BadRequestException('Cannot change owner role');
    }

    const updated = await this.prisma.dinnerCircleMember.update({
      where: { id: memberId },
      data: {
        name: dto.name,
        avatarEmoji: dto.avatarEmoji,
        role: dto.role,
        dietaryNotes: dto.dietaryNotes,
        restrictions: dto.restrictions,
        allergens: dto.allergens,
        preferences: dto.preferences,
      },
    });

    return this.mapMemberToResponse(updated);
  }

  async removeMember(
    userId: string,
    circleId: string,
    memberId: string,
  ): Promise<void> {
    // Check access
    const canModify = await this.canModifyCircle(userId, circleId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to remove members');
    }

    const member = await this.prisma.dinnerCircleMember.findFirst({
      where: { id: memberId, circleId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Can't remove the owner
    if (member.role === 'owner') {
      throw new BadRequestException('Cannot remove the circle owner');
    }

    await this.prisma.dinnerCircleMember.delete({
      where: { id: memberId },
    });
  }

  async getCircleMembers(
    userId: string,
    circleId: string,
  ): Promise<MemberResponseDto[]> {
    const hasAccess = await this.checkCircleAccess(userId, circleId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this circle');
    }

    const members = await this.prisma.dinnerCircleMember.findMany({
      where: { circleId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return members.map((m) => this.mapMemberToResponse(m));
  }

  // Get combined dietary restrictions/allergens for a circle
  async getCircleDietaryInfo(
    userId: string,
    circleId: string,
  ): Promise<{
    restrictions: string[];
    allergens: string[];
    summary: string;
  }> {
    const hasAccess = await this.checkCircleAccess(userId, circleId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this circle');
    }

    const members = await this.prisma.dinnerCircleMember.findMany({
      where: { circleId },
      select: { name: true, restrictions: true, allergens: true },
    });

    // Combine all restrictions and allergens
    const allRestrictions = new Set<string>();
    const allAllergens = new Set<string>();

    for (const member of members) {
      member.restrictions.forEach((r) => allRestrictions.add(r));
      member.allergens.forEach((a) => allAllergens.add(a));
    }

    // Build summary
    const summaryParts: string[] = [];
    if (allRestrictions.size > 0) {
      summaryParts.push(`Avoid: ${Array.from(allRestrictions).join(', ')}`);
    }
    if (allAllergens.size > 0) {
      summaryParts.push(`Allergies: ${Array.from(allAllergens).join(', ')}`);
    }

    return {
      restrictions: Array.from(allRestrictions),
      allergens: Array.from(allAllergens),
      summary: summaryParts.length > 0 ? summaryParts.join('. ') : 'No restrictions',
    };
  }

  // ==================== HELPERS ====================

  private async checkCircleAccess(
    userId: string,
    circleId: string,
  ): Promise<boolean> {
    const circle = await this.prisma.dinnerCircle.findUnique({
      where: { id: circleId },
      include: { members: { where: { userId } } },
    });

    if (!circle) return false;
    return circle.ownerId === userId || circle.members.length > 0;
  }

  private async canModifyCircle(
    userId: string,
    circleId: string,
  ): Promise<boolean> {
    const circle = await this.prisma.dinnerCircle.findUnique({
      where: { id: circleId },
    });

    if (!circle) return false;

    // Owner can always modify
    if (circle.ownerId === userId) return true;

    // Check if user is an admin
    const member = await this.prisma.dinnerCircleMember.findFirst({
      where: { circleId, userId, role: { in: ['owner', 'admin'] } },
    });

    return !!member;
  }

  private mapCircleToResponse(circle: any): DinnerCircleResponseDto {
    return {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      emoji: circle.emoji,
      ownerId: circle.ownerId,
      memberCount: circle._count?.members || circle.members?.length || 0,
      createdAt: circle.createdAt,
      updatedAt: circle.updatedAt,
      members: circle.members?.map((m: any) => this.mapMemberToResponse(m)),
    };
  }

  private mapMemberToResponse(member: any): MemberResponseDto {
    return {
      id: member.id,
      circleId: member.circleId,
      userId: member.userId,
      name: member.name,
      isVirtual: member.isVirtual,
      role: member.role,
      avatarEmoji: member.avatarEmoji,
      dietaryNotes: member.dietaryNotes,
      restrictions: member.restrictions || [],
      allergens: member.allergens || [],
      preferences: member.preferences,
      createdAt: member.createdAt,
    };
  }
}
