import { api } from './api';

// Types
export interface ShareRecipeDto {
  email: string;
  canEdit?: boolean;
  canReshare?: boolean;
  expiresAt?: string;
}

export interface ShareGroupDto {
  email: string;
}

export interface UpdateShareDto {
  canEdit?: boolean;
  canReshare?: boolean;
  expiresAt?: string;
}

export interface SharedRecipe {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeImage?: string;
  sharedByUserId: string;
  sharedByName: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  sharedWithName: string;
  canEdit: boolean;
  canReshare: boolean;
  sharedAt: string;
  expiresAt?: string;
  viewedAt?: string;
}

export interface SharedGroup {
  id: string;
  groupId: string;
  groupName: string;
  groupCoverImage?: string;
  sharedByUserId: string;
  sharedByName: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  sharedWithName: string;
  sharedAt: string;
}

export interface SharedSmartCollection {
  id: string;
  collectionId: string;
  collectionName: string;
  collectionIcon?: string;
  collectionColor?: string;
  isSystem: boolean;
  sharedByUserId: string;
  sharedByName: string;
  sharedWithUserId: string;
  sharedWithEmail: string;
  sharedWithName: string;
  sharedAt: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  name: string;
}

// Share service
export const shareService = {
  // Recipe sharing
  async shareRecipe(recipeId: string, data: ShareRecipeDto): Promise<SharedRecipe> {
    const response = await api.post<SharedRecipe>(`/sharing/recipes/${recipeId}`, data);
    return response.data;
  },

  async getRecipeShares(recipeId: string): Promise<SharedRecipe[]> {
    const response = await api.get<SharedRecipe[]>(`/sharing/recipes/${recipeId}/shares`);
    return response.data;
  },

  async updateRecipeShare(shareId: string, data: UpdateShareDto): Promise<SharedRecipe> {
    const response = await api.patch<SharedRecipe>(`/sharing/recipes/share/${shareId}`, data);
    return response.data;
  },

  async revokeRecipeShare(shareId: string): Promise<void> {
    await api.delete(`/sharing/recipes/share/${shareId}`);
  },

  async getRecipesSharedByMe(): Promise<SharedRecipe[]> {
    const response = await api.get<SharedRecipe[]>('/sharing/recipes/by-me');
    return response.data;
  },

  async getRecipesSharedWithMe(): Promise<SharedRecipe[]> {
    const response = await api.get<SharedRecipe[]>('/sharing/recipes/with-me');
    return response.data;
  },

  // Group/Collection sharing
  async shareGroup(groupId: string, data: ShareGroupDto): Promise<SharedGroup> {
    const response = await api.post<SharedGroup>(`/sharing/groups/${groupId}`, data);
    return response.data;
  },

  async getGroupShares(groupId: string): Promise<SharedGroup[]> {
    const response = await api.get<SharedGroup[]>(`/sharing/groups/${groupId}/shares`);
    return response.data;
  },

  async revokeGroupShare(shareId: string): Promise<void> {
    await api.delete(`/sharing/groups/share/${shareId}`);
  },

  async getGroupsSharedByMe(): Promise<SharedGroup[]> {
    const response = await api.get<SharedGroup[]>('/sharing/groups/by-me');
    return response.data;
  },

  async getGroupsSharedWithMe(): Promise<SharedGroup[]> {
    const response = await api.get<SharedGroup[]>('/sharing/groups/with-me');
    return response.data;
  },

  // Utilities
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const response = await api.get<UserSearchResult[]>('/sharing/users/search', {
      params: { q: query },
    });
    return response.data;
  },

  async markRecipeViewed(recipeId: string): Promise<void> {
    await api.post(`/sharing/recipes/${recipeId}/viewed`);
  },

  // Smart Collection sharing
  async shareSmartCollection(collectionId: string, data: ShareGroupDto): Promise<SharedSmartCollection> {
    const response = await api.post<SharedSmartCollection>(`/sharing/smart-collections/${collectionId}`, data);
    return response.data;
  },

  async getSmartCollectionShares(collectionId: string): Promise<SharedSmartCollection[]> {
    const response = await api.get<SharedSmartCollection[]>(`/sharing/smart-collections/${collectionId}/shares`);
    return response.data;
  },

  async revokeSmartCollectionShare(shareId: string): Promise<void> {
    await api.delete(`/sharing/smart-collections/share/${shareId}`);
  },

  async getSmartCollectionsSharedByMe(): Promise<SharedSmartCollection[]> {
    const response = await api.get<SharedSmartCollection[]>('/sharing/smart-collections/by-me');
    return response.data;
  },

  async getSmartCollectionsSharedWithMe(): Promise<SharedSmartCollection[]> {
    const response = await api.get<SharedSmartCollection[]>('/sharing/smart-collections/with-me');
    return response.data;
  },
};
