import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { cookingPostsService } from '../services/cooking-posts.service';
import type { CookingPost, CreateCookingPostDto, UpdateCookingPostDto } from '../types/cooking-posts.types';

// ==================== QUERY KEYS ====================

export const cookingPostKeys = {
  all: ['cookingPosts'] as const,
  feed: () => [...cookingPostKeys.all, 'feed'] as const,
  user: (userId: string) => [...cookingPostKeys.all, 'user', userId] as const,
  recipe: (recipeId: string) => [...cookingPostKeys.all, 'recipe', recipeId] as const,
  detail: (postId: string) => [...cookingPostKeys.all, 'detail', postId] as const,
};

// ==================== HOOKS ====================

export function useCookingPostsFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: cookingPostKeys.feed(),
    queryFn: ({ pageParam = 0 }) => cookingPostsService.getFeed(limit, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return totalFetched < lastPage.total ? totalFetched : undefined;
    },
    initialPageParam: 0,
  });
}

export function useUserCookingPosts(userId: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: cookingPostKeys.user(userId),
    queryFn: ({ pageParam = 0 }) => cookingPostsService.getUserPosts(userId, limit, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return totalFetched < lastPage.total ? totalFetched : undefined;
    },
    initialPageParam: 0,
    enabled: !!userId,
  });
}

export function useRecipeCookingPosts(recipeId: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: cookingPostKeys.recipe(recipeId),
    queryFn: ({ pageParam = 0 }) => cookingPostsService.getRecipePosts(recipeId, limit, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return totalFetched < lastPage.total ? totalFetched : undefined;
    },
    initialPageParam: 0,
    enabled: !!recipeId,
  });
}

export function useCookingPost(postId: string) {
  return useQuery({
    queryKey: cookingPostKeys.detail(postId),
    queryFn: () => cookingPostsService.getPost(postId),
    enabled: !!postId,
  });
}

export function useCreateCookingPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCookingPostDto) => cookingPostsService.createPost(dto),
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: cookingPostKeys.feed() });
      queryClient.invalidateQueries({ queryKey: cookingPostKeys.user(newPost.userId) });
      queryClient.invalidateQueries({ queryKey: cookingPostKeys.recipe(newPost.recipeId) });
    },
  });
}

export function useUpdateCookingPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, dto }: { postId: string; dto: UpdateCookingPostDto }) =>
      cookingPostsService.updatePost(postId, dto),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: cookingPostKeys.detail(updatedPost.id) });
      queryClient.invalidateQueries({ queryKey: cookingPostKeys.feed() });
    },
  });
}

export function useDeleteCookingPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => cookingPostsService.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cookingPostKeys.all });
    },
  });
}

export function useLikeCookingPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => cookingPostsService.likePost(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: cookingPostKeys.all });

      // Optimistically update
      const updatePost = (post: CookingPost) => {
        if (post.id === postId) {
          return { ...post, isLikedByMe: true, likeCount: post.likeCount + 1 };
        }
        return post;
      };

      // Update in feed
      queryClient.setQueriesData(
        { queryKey: cookingPostKeys.feed() },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map(updatePost),
            })),
          };
        }
      );

      // Update in detail
      queryClient.setQueryData(
        cookingPostKeys.detail(postId),
        (old: CookingPost | undefined) => old ? updatePost(old) : old
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: cookingPostKeys.all });
    },
  });
}

export function useUnlikeCookingPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => cookingPostsService.unlikePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: cookingPostKeys.all });

      const updatePost = (post: CookingPost) => {
        if (post.id === postId) {
          return { ...post, isLikedByMe: false, likeCount: Math.max(0, post.likeCount - 1) };
        }
        return post;
      };

      queryClient.setQueriesData(
        { queryKey: cookingPostKeys.feed() },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map(updatePost),
            })),
          };
        }
      );

      queryClient.setQueryData(
        cookingPostKeys.detail(postId),
        (old: CookingPost | undefined) => old ? updatePost(old) : old
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: cookingPostKeys.all });
    },
  });
}
