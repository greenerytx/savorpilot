import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { challengesService } from '../services/challenges.service';
import type { ChallengeStatus, CreateChallengeDto, CreateEntryDto } from '../types/challenges.types';

export const challengeKeys = {
  all: ['challenges'] as const,
  lists: () => [...challengeKeys.all, 'list'] as const,
  list: (status?: ChallengeStatus) => [...challengeKeys.lists(), { status }] as const,
  active: () => [...challengeKeys.all, 'active'] as const,
  details: () => [...challengeKeys.all, 'detail'] as const,
  detail: (id: string) => [...challengeKeys.details(), id] as const,
  entries: (id: string) => [...challengeKeys.detail(id), 'entries'] as const,
  leaderboard: (id: string) => [...challengeKeys.detail(id), 'leaderboard'] as const,
};

export function useChallenges(status?: ChallengeStatus) {
  return useInfiniteQuery({
    queryKey: challengeKeys.list(status),
    queryFn: ({ pageParam }) =>
      challengesService.getChallenges({ status, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useActiveChallenge() {
  return useQuery({
    queryKey: challengeKeys.active(),
    queryFn: () => challengesService.getActiveChallenge(),
  });
}

export function useChallengeDetail(id: string) {
  return useQuery({
    queryKey: challengeKeys.detail(id),
    queryFn: () => challengesService.getChallengeById(id),
    enabled: !!id,
  });
}

export function useChallengeEntries(challengeId: string) {
  return useInfiniteQuery({
    queryKey: challengeKeys.entries(challengeId),
    queryFn: ({ pageParam }) =>
      challengesService.getEntries(challengeId, { cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!challengeId,
  });
}

export function useChallengeLeaderboard(challengeId: string, limit?: number) {
  return useQuery({
    queryKey: challengeKeys.leaderboard(challengeId),
    queryFn: () => challengesService.getLeaderboard(challengeId, limit),
    enabled: !!challengeId,
  });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateChallengeDto) => challengesService.createChallenge(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() });
    },
  });
}

export function useSubmitEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challengeId, dto }: { challengeId: string; dto: CreateEntryDto }) =>
      challengesService.submitEntry(challengeId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(variables.challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.entries(variables.challengeId) });
    },
  });
}

export function useVoteForEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challengeId, entryId }: { challengeId: string; entryId: string }) =>
      challengesService.voteForEntry(challengeId, entryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.entries(variables.challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.leaderboard(variables.challengeId) });
    },
  });
}

export function useRemoveVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challengeId, entryId }: { challengeId: string; entryId: string }) =>
      challengesService.removeVote(challengeId, entryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.entries(variables.challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.leaderboard(variables.challengeId) });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challengeId, entryId }: { challengeId: string; entryId: string }) =>
      challengesService.deleteEntry(challengeId, entryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.detail(variables.challengeId) });
      queryClient.invalidateQueries({ queryKey: challengeKeys.entries(variables.challengeId) });
    },
  });
}
