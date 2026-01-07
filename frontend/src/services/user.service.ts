import { api } from './api';

// ==================== TYPES ====================

export interface UserPreferences {
  id: string;
  language: string;
  defaultServings: number;
  preferredUnits: 'metric' | 'imperial';
  timezone: string;
}

export interface UpdatePreferencesDto {
  language?: string;
  defaultServings?: number;
  preferredUnits?: 'metric' | 'imperial';
  timezone?: string;
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

// ==================== SERVICE ====================

export const userService = {
  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }
    const response = await api.get<UserSearchResult[]>('/users/search', {
      params: { q: query },
    });
    return response.data;
  },
  /**
   * Get current user's preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const response = await api.get<UserPreferences>('/users/preferences');
    return response.data;
  },

  /**
   * Update current user's preferences
   */
  async updatePreferences(dto: UpdatePreferencesDto): Promise<UserPreferences> {
    const response = await api.patch<UserPreferences>('/users/preferences', dto);
    return response.data;
  },
};
