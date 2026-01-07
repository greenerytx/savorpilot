export type CommentAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
};

export type RecipeComment = {
  id: string;
  recipeId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  author: CommentAuthor;
  parentId?: string;
  likeCount: number;
  isLikedByMe: boolean;
  replyCount: number;
  replies?: RecipeComment[];
};

export type CommentListResponse = {
  data: RecipeComment[];
  total: number;
};

export type CreateCommentDto = {
  content: string;
  parentId?: string;
};

export type UpdateCommentDto = {
  content: string;
};
