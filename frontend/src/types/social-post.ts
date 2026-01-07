// Social Post Types

export const SocialPostType = {
  COOKING_UPDATE: 'COOKING_UPDATE',
  QUESTION: 'QUESTION',
  TIP: 'TIP',
  PHOTO: 'PHOTO',
  GENERAL: 'GENERAL',
} as const;
export type SocialPostType = (typeof SocialPostType)[keyof typeof SocialPostType];

export const SocialPostVisibility = {
  PRIVATE: 'PRIVATE',
  FOLLOWERS: 'FOLLOWERS',
  PUBLIC: 'PUBLIC',
} as const;
export type SocialPostVisibility =
  (typeof SocialPostVisibility)[keyof typeof SocialPostVisibility];

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface PostRecipePreview {
  id: string;
  title: string;
  imageUrl?: string;
}

export interface SocialPost {
  id: string;
  postType: SocialPostType;
  content: string;
  imageUrl?: string;
  recipe?: PostRecipePreview;
  author: PostAuthor;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  visibility: SocialPostVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostComment {
  id: string;
  content: string;
  author: PostAuthor;
  parentId?: string;
  likeCount: number;
  isLikedByMe: boolean;
  replyCount: number;
  createdAt: string;
  replies?: SocialPostComment[];
}

export interface CreateSocialPostDto {
  postType: SocialPostType;
  content: string;
  imageUrl?: string;
  recipeId?: string;
  visibility?: SocialPostVisibility;
}

export interface UpdateSocialPostDto {
  postType?: SocialPostType;
  content?: string;
  imageUrl?: string;
  recipeId?: string;
  visibility?: SocialPostVisibility;
}

export interface CreateSocialPostCommentDto {
  content: string;
  parentId?: string;
}

export interface SocialFeedQuery {
  limit?: number;
  cursor?: string;
  postType?: SocialPostType;
}

export interface UserPostsQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedFeed {
  data: SocialPost[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface PaginatedPosts {
  data: SocialPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedComments {
  data: SocialPostComment[];
  total: number;
  hasMore: boolean;
}

// Helper for post type display
export const postTypeConfig: Record<
  SocialPostType,
  { label: string; icon: string; color: string }
> = {
  COOKING_UPDATE: {
    label: 'Made This',
    icon: 'ChefHat',
    color: 'green',
  },
  QUESTION: {
    label: 'Question',
    icon: 'HelpCircle',
    color: 'blue',
  },
  TIP: {
    label: 'Tip',
    icon: 'Lightbulb',
    color: 'amber',
  },
  PHOTO: {
    label: 'Photo',
    icon: 'Camera',
    color: 'purple',
  },
  GENERAL: {
    label: 'Discussion',
    icon: 'MessageSquare',
    color: 'slate',
  },
};
