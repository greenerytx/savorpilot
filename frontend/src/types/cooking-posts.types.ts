export type PostVisibility = 'PUBLIC' | 'FOLLOWERS' | 'CIRCLES' | 'PRIVATE';

export type PostAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
};

export type PostRecipe = {
  id: string;
  title: string;
  imageUrl?: string;
};

export type CookingPost = {
  id: string;
  userId: string;
  recipeId: string;
  photoUrl?: string;
  caption?: string;
  rating?: number;
  visibility: PostVisibility;
  createdAt: string;
  likeCount: number;
  isLikedByMe: boolean;
  author: PostAuthor;
  recipe: PostRecipe;
};

export type CookingPostListResponse = {
  data: CookingPost[];
  total: number;
};

export type CreateCookingPostDto = {
  recipeId: string;
  photoUrl?: string;
  caption?: string;
  rating?: number;
  visibility?: PostVisibility;
};

export type UpdateCookingPostDto = {
  caption?: string;
  rating?: number;
  visibility?: PostVisibility;
};
