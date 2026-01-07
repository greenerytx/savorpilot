import { api } from './api';
import type {
  SocialPost,
  SocialPostComment,
  CreateSocialPostDto,
  UpdateSocialPostDto,
  CreateSocialPostCommentDto,
  SocialFeedQuery,
  UserPostsQuery,
  PaginatedFeed,
  PaginatedPosts,
  PaginatedComments,
} from '../types/social-post';

// Re-export types
export type {
  SocialPostType,
  SocialPostVisibility,
  PostAuthor,
  PostRecipePreview,
  SocialPost,
  SocialPostComment,
  CreateSocialPostDto,
  UpdateSocialPostDto,
  CreateSocialPostCommentDto,
  SocialFeedQuery,
  PaginatedFeed,
  PaginatedPosts,
  PaginatedComments,
} from '../types/social-post';

export { postTypeConfig } from '../types/social-post';

export const socialPostsService = {
  // Posts CRUD
  async createPost(dto: CreateSocialPostDto): Promise<SocialPost> {
    const response = await api.post<SocialPost>('/social-posts', dto);
    return response.data;
  },

  async getPost(postId: string): Promise<SocialPost> {
    const response = await api.get<SocialPost>(`/social-posts/${postId}`);
    return response.data;
  },

  async updatePost(postId: string, dto: UpdateSocialPostDto): Promise<SocialPost> {
    const response = await api.put<SocialPost>(`/social-posts/${postId}`, dto);
    return response.data;
  },

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/social-posts/${postId}`);
  },

  // Feed & User Posts
  async getFeed(query: SocialFeedQuery = {}): Promise<PaginatedFeed> {
    const response = await api.get<PaginatedFeed>('/social-posts/feed', {
      params: query,
    });
    return response.data;
  },

  async getUserPosts(userId: string, query: UserPostsQuery = {}): Promise<PaginatedPosts> {
    const response = await api.get<PaginatedPosts>(`/social-posts/user/${userId}`, {
      params: query,
    });
    return response.data;
  },

  // Likes
  async likePost(postId: string): Promise<void> {
    await api.post(`/social-posts/${postId}/like`);
  },

  async unlikePost(postId: string): Promise<void> {
    await api.delete(`/social-posts/${postId}/like`);
  },

  // Comments
  async getComments(
    postId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedComments> {
    const response = await api.get<PaginatedComments>(
      `/social-posts/${postId}/comments`,
      { params: { page, limit } },
    );
    return response.data;
  },

  async addComment(
    postId: string,
    dto: CreateSocialPostCommentDto,
  ): Promise<SocialPostComment> {
    const response = await api.post<SocialPostComment>(
      `/social-posts/${postId}/comments`,
      dto,
    );
    return response.data;
  },

  async deleteComment(postId: string, commentId: string): Promise<void> {
    await api.delete(`/social-posts/${postId}/comments/${commentId}`);
  },
};
