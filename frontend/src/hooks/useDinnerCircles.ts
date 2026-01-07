import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dinnerCirclesService } from '../services/dinner-circles.service';
import type {
  CreateCircleDto,
  UpdateCircleDto,
  CreateMemberDto,
  UpdateMemberDto,
} from '../services/dinner-circles.service';

// ==================== QUERY KEYS ====================

export const circleKeys = {
  all: ['dinner-circles'] as const,
  lists: () => [...circleKeys.all, 'list'] as const,
  detail: (id: string) => [...circleKeys.all, 'detail', id] as const,
  members: (id: string) => [...circleKeys.detail(id), 'members'] as const,
  dietary: (id: string) => [...circleKeys.detail(id), 'dietary'] as const,
  options: () => [...circleKeys.all, 'options'] as const,
};

// ==================== CIRCLE HOOKS ====================

export function useCircles() {
  return useQuery({
    queryKey: circleKeys.lists(),
    queryFn: () => dinnerCirclesService.getCircles(),
  });
}

export function useCircle(id: string) {
  return useQuery({
    queryKey: circleKeys.detail(id),
    queryFn: () => dinnerCirclesService.getCircle(id),
    enabled: !!id,
  });
}

export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateCircleDto) => dinnerCirclesService.createCircle(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circleKeys.lists() });
    },
  });
}

export function useUpdateCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCircleDto }) =>
      dinnerCirclesService.updateCircle(id, dto),
    onSuccess: (circle) => {
      queryClient.setQueryData(circleKeys.detail(circle.id), circle);
      queryClient.invalidateQueries({ queryKey: circleKeys.lists() });
    },
  });
}

export function useDeleteCircle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dinnerCirclesService.deleteCircle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: circleKeys.lists() });
    },
  });
}

export function useCircleOptions() {
  return useQuery({
    queryKey: circleKeys.options(),
    queryFn: () => dinnerCirclesService.getOptions(),
    staleTime: Infinity, // Options don't change
  });
}

// ==================== MEMBER HOOKS ====================

export function useCircleMembers(circleId: string) {
  return useQuery({
    queryKey: circleKeys.members(circleId),
    queryFn: () => dinnerCirclesService.getMembers(circleId),
    enabled: !!circleId,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ circleId, dto }: { circleId: string; dto: CreateMemberDto }) =>
      dinnerCirclesService.addMember(circleId, dto),
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: circleKeys.members(circleId) });
      queryClient.invalidateQueries({ queryKey: circleKeys.dietary(circleId) });
      queryClient.invalidateQueries({ queryKey: circleKeys.lists() });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      circleId,
      memberId,
      dto,
    }: {
      circleId: string;
      memberId: string;
      dto: UpdateMemberDto;
    }) => dinnerCirclesService.updateMember(circleId, memberId, dto),
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: circleKeys.members(circleId) });
      queryClient.invalidateQueries({ queryKey: circleKeys.dietary(circleId) });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ circleId, memberId }: { circleId: string; memberId: string }) =>
      dinnerCirclesService.removeMember(circleId, memberId),
    onSuccess: (_, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
      queryClient.invalidateQueries({ queryKey: circleKeys.members(circleId) });
      queryClient.invalidateQueries({ queryKey: circleKeys.dietary(circleId) });
      queryClient.invalidateQueries({ queryKey: circleKeys.lists() });
    },
  });
}

// ==================== DIETARY INFO HOOK ====================

export function useCircleDietaryInfo(circleId: string) {
  return useQuery({
    queryKey: circleKeys.dietary(circleId),
    queryFn: () => dinnerCirclesService.getDietaryInfo(circleId),
    enabled: !!circleId,
  });
}
