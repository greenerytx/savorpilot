import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeCommentsService } from '../services/recipe-comments.service';
import type { RecipeComment, CreateCommentDto, UpdateCommentDto } from '../types/recipe-comments.types';

// ==================== QUERY KEYS ====================

export const commentKeys = {
  all: ['comments'] as const,
  recipe: (recipeId: string) => [...commentKeys.all, 'recipe', recipeId] as const,
  replies: (recipeId: string, commentId: string) => [...commentKeys.all, 'replies', recipeId, commentId] as const,
};

// ==================== HOOKS ====================

export function useRecipeComments(recipeId: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...commentKeys.recipe(recipeId), { limit, offset }],
    queryFn: () => recipeCommentsService.getComments(recipeId, limit, offset),
    enabled: !!recipeId,
  });
}

export function useCommentReplies(recipeId: string, commentId: string, enabled = true) {
  return useQuery({
    queryKey: commentKeys.replies(recipeId, commentId),
    queryFn: () => recipeCommentsService.getReplies(recipeId, commentId),
    enabled: enabled && !!recipeId && !!commentId,
  });
}

export function useCreateComment(recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCommentDto) => recipeCommentsService.createComment(recipeId, dto),
    onSuccess: (newComment) => {
      // If it's a reply, invalidate the replies query
      if (newComment.parentId) {
        queryClient.invalidateQueries({ queryKey: commentKeys.replies(recipeId, newComment.parentId) });
      }
      // Always invalidate the main comments list
      queryClient.invalidateQueries({ queryKey: commentKeys.recipe(recipeId) });
    },
  });
}

export function useUpdateComment(recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, dto }: { commentId: string; dto: UpdateCommentDto }) =>
      recipeCommentsService.updateComment(recipeId, commentId, dto),
    onSuccess: (updatedComment) => {
      // Update the comment in cache optimistically
      queryClient.invalidateQueries({ queryKey: commentKeys.recipe(recipeId) });
      if (updatedComment.parentId) {
        queryClient.invalidateQueries({ queryKey: commentKeys.replies(recipeId, updatedComment.parentId) });
      }
    },
  });
}

export function useDeleteComment(recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => recipeCommentsService.deleteComment(recipeId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.recipe(recipeId) });
    },
  });
}

export function useLikeComment(recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => recipeCommentsService.likeComment(recipeId, commentId),
    onMutate: async (commentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: commentKeys.recipe(recipeId) });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData(commentKeys.recipe(recipeId));

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: commentKeys.recipe(recipeId) },
        (old: { data: RecipeComment[]; total: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((comment) =>
              comment.id === commentId
                ? { ...comment, isLikedByMe: true, likeCount: comment.likeCount + 1 }
                : comment
            ),
          };
        }
      );

      return { previousComments };
    },
    onError: (_err, _commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentKeys.recipe(recipeId), context.previousComments);
      }
    },
  });
}

export function useUnlikeComment(recipeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => recipeCommentsService.unlikeComment(recipeId, commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: commentKeys.recipe(recipeId) });

      const previousComments = queryClient.getQueryData(commentKeys.recipe(recipeId));

      queryClient.setQueriesData(
        { queryKey: commentKeys.recipe(recipeId) },
        (old: { data: RecipeComment[]; total: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((comment) =>
              comment.id === commentId
                ? { ...comment, isLikedByMe: false, likeCount: Math.max(0, comment.likeCount - 1) }
                : comment
            ),
          };
        }
      );

      return { previousComments };
    },
    onError: (_err, _commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentKeys.recipe(recipeId), context.previousComments);
      }
    },
  });
}
