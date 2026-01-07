import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(query: string, currentUserId: string, limit = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } }, // Exclude current user
          { status: 'ACTIVE' },
          {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
      },
      take: limit,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return users.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatarUrl: user.avatarUrl,
    }));
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.defaultServings !== undefined && { defaultServings: dto.defaultServings }),
        ...(dto.preferredUnits !== undefined && { preferredUnits: dto.preferredUnits }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      },
    });

    return {
      id: updated.id,
      language: updated.language,
      defaultServings: updated.defaultServings,
      preferredUnits: updated.preferredUnits,
      timezone: updated.timezone,
    };
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        language: true,
        defaultServings: true,
        preferredUnits: true,
        timezone: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
