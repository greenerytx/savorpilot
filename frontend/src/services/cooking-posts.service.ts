import { api } from './api';
import type {
  CookingPost,
  CookingPostListResponse,
  CreateCookingPostDto,
  UpdateCookingPostDto,
} from '../types/cooking-posts.types';

// Re-export types
export type {
  PostVisibility,
  PostAuthor,
  PostRecipe,
  CookingPost,
  CookingPostListResponse,
  CreateCookingPostDto,
  UpdateCookingPostDto,
} from '../types/cooking-posts.types';

export const cookingPostsService = {
  async createPost(dto: CreateCookingPostDto): Promise<CookingPost> {
    const response = await api.post<CookingPost>('/cooking-posts', dto);
    return response.data;
  },

  async getPost(postId: string): Promise<CookingPost> {
    const response = await api.get<CookingPost>(`/cooking-posts/${postId}`);
    return response.data;
  },

  async getFeed(limit = 20, offset = 0): Promise<CookingPostListResponse> {
    const response = await api.get<CookingPostListResponse>(
      '/cooking-posts/feed',
      { params: { limit, offset } }
    );
    return response.data;
  },

  async getUserPosts(userId: string, limit = 20, offset = 0): Promise<CookingPostListResponse> {
    const response = await api.get<CookingPostListResponse>(
      `/cooking-posts/user/${userId}`,
      { params: { limit, offset } }
    );
    return response.data;
  },

  async getRecipePosts(recipeId: string, limit = 20, offset = 0): Promise<CookingPostListResponse> {
    const response = await api.get<CookingPostListResponse>(
      `/cooking-posts/recipe/${recipeId}`,
      { params: { limit, offset } }
    );
    return response.data;
  },

  async updatePost(postId: string, dto: UpdateCookingPostDto): Promise<CookingPost> {
    const response = await api.put<CookingPost>(`/cooking-posts/${postId}`, dto);
    return response.data;
  },

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/cooking-posts/${postId}`);
  },

  async likePost(postId: string): Promise<void> {
    await api.post(`/cooking-posts/${postId}/like`);
  },

  async unlikePost(postId: string): Promise<void> {
    await api.delete(`/cooking-posts/${postId}/like`);
  },
};
