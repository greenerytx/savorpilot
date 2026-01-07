import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { socialPostsService } from '../services/social-posts.service';
import type {
  SocialPost,
  CreateSocialPostDto,
  UpdateSocialPostDto,
  CreateSocialPostCommentDto,
  SocialFeedQuery,
  SocialPostType,
} from '../types/social-post';

// ==================== QUERY KEYS ====================

export const socialPostKeys = {
  all: ['socialPosts'] as const,
  feed: (postType?: SocialPostType) =>
    [...socialPostKeys.all, 'feed', { postType }] as const,
  userPosts: (userId: string) =>
    [...socialPostKeys.all, 'user', userId] as const,
  post: (postId: string) => [...socialPostKeys.all, 'post', postId] as const,
  comments: (postId: string) =>
    [...socialPostKeys.all, 'comments', postId] as const,
};

// ==================== FEED HOOKS ====================

export function useSocialFeed(postType?: SocialPostType, limit = 20) {
  return useInfiniteQuery({
    queryKey: socialPostKeys.feed(postType),
    queryFn: ({ pageParam }) =>
      socialPostsService.getFeed({
        limit,
        cursor: pageParam,
        postType,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useUserSocialPosts(userId: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: socialPostKeys.userPosts(userId),
    queryFn: ({ pageParam = 1 }) =>
      socialPostsService.getUserPosts(userId, { page: pageParam, limit }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!userId,
  });
}

// ==================== SINGLE POST HOOKS ====================

export function useSocialPost(postId: string) {
  return useQuery({
    queryKey: socialPostKeys.post(postId),
    queryFn: () => socialPostsService.getPost(postId),
    enabled: !!postId,
  });
}

// ==================== MUTATION HOOKS ====================

export function useCreateSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSocialPostDto) => socialPostsService.createPost(dto),
    onSuccess: (newPost) => {
      // Invalidate all feed queries
      queryClient.invalidateQueries({
        queryKey: socialPostKeys.feed(),
      });

      // Also invalidate user posts if the user is viewing their own posts
      queryClient.invalidateQueries({
        queryKey: socialPostKeys.userPosts(newPost.author.id),
      });
    },
  });
}

export function useUpdateSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, dto }: { postId: string; dto: UpdateSocialPostDto }) =>
      socialPostsService.updatePost(postId, dto),
    onSuccess: (updatedPost) => {
      // Update the single post cache
      queryClient.setQueryData(
        socialPostKeys.post(updatedPost.id),
        updatedPost,
      );

      // Invalidate feeds to reflect changes
      queryClient.invalidateQueries({
        queryKey: socialPostKeys.feed(),
      });
    },
  });
}

export function useDeleteSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => socialPostsService.deletePost(postId),
    onSuccess: (_, postId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: socialPostKeys.post(postId),
      });

      // Invalidate feeds
      queryClient.invalidateQueries({
        queryKey: socialPostKeys.feed(),
      });
    },
  });
}

// ==================== LIKE HOOKS ====================

export function useLikeSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => socialPostsService.likePost(postId),
    onMutate: async (postId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: socialPostKeys.post(postId),
      });

      // Snapshot the previous value
      const previousPost = queryClient.getQueryData<SocialPost>(
        socialPostKeys.post(postId),
      );

      // Optimistically update
      if (previousPost) {
        queryClient.setQueryData(socialPostKeys.post(postId), {
          ...previousPost,
          isLikedByMe: true,
          likeCount: previousPost.likeCount + 1,
        });
      }

      // Also update in feeds optimistically
      queryClient.setQueriesData(
        { queryKey: socialPostKeys.feed() },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((post: SocialPost) =>
                post.id === postId
                  ? {
                      ...post,
                      isLikedByMe: true,
                      likeCount: post.likeCount + 1,
                    }
                  : post,
              ),
            })),
          };
        },
      );

      return { previousPost };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(
          socialPostKeys.post(postId),
          context.previousPost,
        );
      }
      queryClient.invalidateQueries({
        queryKey: socialPostKeys.feed(),
      });
    },
  });
}

export function useUnlikeSocialPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => socialPostsService.unlikePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({
        queryKey: socialPostKeys.post(postId),
      });

      const previousPost = queryClient.getQueryData<SocialPost>(
        socialPostKeys.post(postId),
      );

      if (previousPost) {
        queryClient.setQueryData(socialPostKeys.post(postId), {
          ...previousPost,
          isLikedByMe: false,
          likeCount: Math.max(0, previousPost.likeCount - 1),
        });
      }

      queryClient.setQueriesData(
        { queryKey: socialPostKeys.feed() },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((post: SocialPost) =>
                post.id === postId
                  ? {
                      ...post,
                      isLikedByMe: false,
                      likeCount: Math.max(0, post.likeCount - 1),
                    }
                  : post,
              ),
            })),
          };
        },
      );

      return { previousPost };
    },
    onError: (err, postId, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(
          socialPostKeys.post(postId),
          context.previousPost,
        );
      }
      queryClient.invalidateQueries({
        queryKey: socialPostKeys.feed(),
      });
    },
  });
}

// ==================== COMMENT HOOKS ====================

export function useSocialPostComments(postId: string, enabled = true, limit = 20) {
  return useInfiniteQuery({
    queryKey: socialPostKeys.comments(postId),
    queryFn: ({ pageParam = 1 }) =>
      socialPostsService.getComments(postId, pageParam, limit),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce(
        (acc, page) => acc + page.data.length,
        0,
      );
      return totalFetched < lastPage.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!postId && enabled,
  });
}

export function useAddSocialPostComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      dto,
    }: {
      postId: string;
      dto: CreateSocialPostCommentDto;
    }) => socialPostsService.addComment(postId, dto),
    onSuccess: (_, { postId }) => {
      // Invalidate comments
      queryClient.invalidateQueries({
        queryKey: socialPostKeys.comments(postId),
      });

      // Update comment count in post
      const post = queryClient.getQueryData<SocialPost>(
        socialPostKeys.post(postId),
      );
      if (post) {
        queryClient.setQueryData(socialPostKeys.post(postId), {
          ...post,
          commentCount: post.commentCount + 1,
        });
      }

      // Update in feeds
      queryClient.setQueriesData(
        { queryKey: socialPostKeys.feed() },
        (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((p: SocialPost) =>
                p.id === postId
                  ? { ...p, commentCount: p.commentCount + 1 }
                  : p,
              ),
            })),
          };
        },
      );
    },
  });
}

export function useDeleteSocialPostComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      socialPostsService.deleteComment(postId, commentId),
    onSuccess: (_, { postId }) => {
      // Invalidate comments
      queryClient.invalidateQueries({
        queryKey: socialPostKeys.comments(postId),
      });

      // Update comment count
      const post = queryClient.getQueryData<SocialPost>(
        socialPostKeys.post(postId),
      );
      if (post) {
        queryClient.setQueryData(socialPostKeys.post(postId), {
          ...post,
          commentCount: Math.max(0, post.commentCount - 1),
        });
      }
    },
  });
}
