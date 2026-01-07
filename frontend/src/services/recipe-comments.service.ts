import { api } from './api';
import type {
  RecipeComment,
  CommentListResponse,
  CreateCommentDto,
  UpdateCommentDto,
} from '../types/recipe-comments.types';

// Re-export types for convenience
export type { RecipeComment, CommentAuthor, CommentListResponse, CreateCommentDto, UpdateCommentDto } from '../types/recipe-comments.types';

export const recipeCommentsService = {
  async getComments(recipeId: string, limit = 50, offset = 0): Promise<CommentListResponse> {
    const response = await api.get<CommentListResponse>(
      `/recipes/${recipeId}/comments`,
      { params: { limit, offset } }
    );
    return response.data;
  },

  async getReplies(recipeId: string, commentId: string, limit = 20, offset = 0): Promise<CommentListResponse> {
    const response = await api.get<CommentListResponse>(
      `/recipes/${recipeId}/comments/${commentId}/replies`,
      { params: { limit, offset } }
    );
    return response.data;
  },

  async createComment(recipeId: string, dto: CreateCommentDto): Promise<RecipeComment> {
    const response = await api.post<RecipeComment>(
      `/recipes/${recipeId}/comments`,
      dto
    );
    return response.data;
  },

  async updateComment(recipeId: string, commentId: string, dto: UpdateCommentDto): Promise<RecipeComment> {
    const response = await api.put<RecipeComment>(
      `/recipes/${recipeId}/comments/${commentId}`,
      dto
    );
    return response.data;
  },

  async deleteComment(recipeId: string, commentId: string): Promise<void> {
    await api.delete(`/recipes/${recipeId}/comments/${commentId}`);
  },

  async likeComment(recipeId: string, commentId: string): Promise<void> {
    await api.post(`/recipes/${recipeId}/comments/${commentId}/like`);
  },

  async unlikeComment(recipeId: string, commentId: string): Promise<void> {
    await api.delete(`/recipes/${recipeId}/comments/${commentId}/like`);
  },
};
