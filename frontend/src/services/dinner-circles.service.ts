import { api } from './api';

// ==================== TYPES ====================

export interface DinnerCircle {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  members?: CircleMember[];
}

export interface CircleMember {
  id: string;
  circleId: string;
  userId?: string;
  name: string;
  isVirtual: boolean;
  role: 'owner' | 'admin' | 'member';
  avatarEmoji?: string;
  dietaryNotes?: string;
  restrictions: string[];
  allergens: string[];
  preferences?: Record<string, number>;
  createdAt: string;
}

export interface CreateCircleDto {
  name: string;
  description?: string;
  emoji?: string;
}

export interface UpdateCircleDto {
  name?: string;
  description?: string;
  emoji?: string;
}

export interface CreateMemberDto {
  name: string;
  userId?: string;
  isVirtual?: boolean;
  avatarEmoji?: string;
  role?: 'admin' | 'member';
  dietaryNotes?: string;
  restrictions?: string[];
  allergens?: string[];
  preferences?: Record<string, number>;
}

export interface UpdateMemberDto extends Partial<CreateMemberDto> {}

export interface CircleOptions {
  restrictions: string[];
  allergens: string[];
  emojis: string[];
}

export interface DietaryInfo {
  restrictions: string[];
  allergens: string[];
  summary: string;
}

// ==================== SERVICE ====================

export const dinnerCirclesService = {
  // Circles
  async createCircle(dto: CreateCircleDto): Promise<DinnerCircle> {
    const response = await api.post<DinnerCircle>('/dinner-circles', dto);
    return response.data;
  },

  async getCircles(): Promise<DinnerCircle[]> {
    const response = await api.get<DinnerCircle[]>('/dinner-circles');
    return response.data;
  },

  async getCircle(id: string): Promise<DinnerCircle> {
    const response = await api.get<DinnerCircle>(`/dinner-circles/${id}`);
    return response.data;
  },

  async updateCircle(id: string, dto: UpdateCircleDto): Promise<DinnerCircle> {
    const response = await api.put<DinnerCircle>(`/dinner-circles/${id}`, dto);
    return response.data;
  },

  async deleteCircle(id: string): Promise<void> {
    await api.delete(`/dinner-circles/${id}`);
  },

  async getOptions(): Promise<CircleOptions> {
    const response = await api.get<CircleOptions>('/dinner-circles/options');
    return response.data;
  },

  // Members
  async addMember(circleId: string, dto: CreateMemberDto): Promise<CircleMember> {
    const response = await api.post<CircleMember>(
      `/dinner-circles/${circleId}/members`,
      dto
    );
    return response.data;
  },

  async getMembers(circleId: string): Promise<CircleMember[]> {
    const response = await api.get<CircleMember[]>(
      `/dinner-circles/${circleId}/members`
    );
    return response.data;
  },

  async updateMember(
    circleId: string,
    memberId: string,
    dto: UpdateMemberDto
  ): Promise<CircleMember> {
    const response = await api.put<CircleMember>(
      `/dinner-circles/${circleId}/members/${memberId}`,
      dto
    );
    return response.data;
  },

  async removeMember(circleId: string, memberId: string): Promise<void> {
    await api.delete(`/dinner-circles/${circleId}/members/${memberId}`);
  },

  async getDietaryInfo(circleId: string): Promise<DietaryInfo> {
    const response = await api.get<DietaryInfo>(
      `/dinner-circles/${circleId}/dietary-info`
    );
    return response.data;
  },
};
