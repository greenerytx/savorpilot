import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partyEventsService } from '../services/party-events.service';
import type {
  PartyEvent,
  PartyEventDetail,
  PartyEventMember,
  PartyEventRecipe,
  PartyEventAssignment,
  CreatePartyEventDto,
  UpdatePartyEventDto,
  InviteMemberDto,
  UpdateMemberDto,
  RsvpDto,
  PinRecipeDto,
  UpdatePinnedRecipeDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from '../services/party-events.service';

// Query keys
export const partyEventKeys = {
  all: ['party-events'] as const,
  lists: () => [...partyEventKeys.all, 'list'] as const,
  details: () => [...partyEventKeys.all, 'detail'] as const,
  detail: (id: string) => [...partyEventKeys.details(), id] as const,
  options: () => [...partyEventKeys.all, 'options'] as const,
  circles: () => [...partyEventKeys.all, 'circles'] as const,
  invite: (code: string) => [...partyEventKeys.all, 'invite', code] as const,
  members: (eventId: string) => [...partyEventKeys.all, eventId, 'members'] as const,
  recipes: (eventId: string) => [...partyEventKeys.all, eventId, 'recipes'] as const,
  assignments: (eventId: string) => [...partyEventKeys.all, eventId, 'assignments'] as const,
  dietary: (eventId: string) => [...partyEventKeys.all, eventId, 'dietary'] as const,
  compatibility: (eventId: string, recipeId: string) => [...partyEventKeys.all, eventId, 'compatibility', recipeId] as const,
  shoppingList: (eventId: string) => [...partyEventKeys.all, eventId, 'shopping-list'] as const,
};

// ==================== EVENTS ====================

export function usePartyEvents() {
  return useQuery({
    queryKey: partyEventKeys.lists(),
    queryFn: () => partyEventsService.getEvents(),
  });
}

export function usePartyEvent(id: string) {
  return useQuery({
    queryKey: partyEventKeys.detail(id),
    queryFn: () => partyEventsService.getEvent(id),
    enabled: !!id,
  });
}

export function useEventOptions() {
  return useQuery({
    queryKey: partyEventKeys.options(),
    queryFn: () => partyEventsService.getOptions(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCirclesForEventCreation() {
  return useQuery({
    queryKey: partyEventKeys.circles(),
    queryFn: () => partyEventsService.getCirclesForEventCreation(),
  });
}

export function useImportCircleMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => partyEventsService.importCircleMembers(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.members(eventId) });
    },
  });
}

export function useRecipeCompatibility(eventId: string, recipeId: string) {
  return useQuery({
    queryKey: partyEventKeys.compatibility(eventId, recipeId),
    queryFn: () => partyEventsService.checkRecipeCompatibility(eventId, recipeId),
    enabled: !!eventId && !!recipeId,
  });
}

export function useCreatePartyEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePartyEventDto) => partyEventsService.createEvent(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.all });
    },
  });
}

export function useUpdatePartyEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePartyEventDto }) =>
      partyEventsService.updateEvent(id, dto),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.all });
      queryClient.setQueryData(partyEventKeys.detail(variables.id), data);
    },
  });
}

export function useDeletePartyEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => partyEventsService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.all });
    },
  });
}

// ==================== INVITE LINKS ====================

export function useEventByInviteCode(inviteCode: string) {
  return useQuery({
    queryKey: partyEventKeys.invite(inviteCode),
    queryFn: () => partyEventsService.getEventByInviteCode(inviteCode),
    enabled: !!inviteCode,
  });
}

export function useJoinEventByInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteCode: string) => partyEventsService.joinEventByInviteCode(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.all });
    },
  });
}

// ==================== MEMBERS ====================

export function useEventMembers(eventId: string) {
  return useQuery({
    queryKey: partyEventKeys.members(eventId),
    queryFn: () => partyEventsService.getMembers(eventId),
    enabled: !!eventId,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, dto }: { eventId: string; dto: InviteMemberDto }) =>
      partyEventsService.inviteMember(eventId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.members(variables.eventId) });
    },
  });
}

export function useUpdateEventMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      memberId,
      dto,
    }: {
      eventId: string;
      memberId: string;
      dto: UpdateMemberDto;
    }) => partyEventsService.updateMember(eventId, memberId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.members(variables.eventId) });
    },
  });
}

export function useRemoveEventMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, memberId }: { eventId: string; memberId: string }) =>
      partyEventsService.removeMember(eventId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.members(variables.eventId) });
    },
  });
}

export function useUpdateRsvp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, dto }: { eventId: string; dto: RsvpDto }) =>
      partyEventsService.updateRsvp(eventId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.members(variables.eventId) });
    },
  });
}

export function useEventDietaryInfo(eventId: string) {
  return useQuery({
    queryKey: partyEventKeys.dietary(eventId),
    queryFn: () => partyEventsService.getDietaryInfo(eventId),
    enabled: !!eventId,
  });
}

// ==================== RECIPES ====================

export function useEventRecipes(eventId: string) {
  return useQuery({
    queryKey: partyEventKeys.recipes(eventId),
    queryFn: () => partyEventsService.getRecipes(eventId),
    enabled: !!eventId,
  });
}

export function usePinRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, dto }: { eventId: string; dto: PinRecipeDto }) =>
      partyEventsService.pinRecipe(eventId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.recipes(variables.eventId) });
    },
  });
}

export function useUpdatePinnedRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      recipeId,
      dto,
    }: {
      eventId: string;
      recipeId: string;
      dto: UpdatePinnedRecipeDto;
    }) => partyEventsService.updatePinnedRecipe(eventId, recipeId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.recipes(variables.eventId) });
    },
  });
}

export function useUnpinRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, recipeId }: { eventId: string; recipeId: string }) =>
      partyEventsService.unpinRecipe(eventId, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.recipes(variables.eventId) });
    },
  });
}

export function useClaimRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, recipeId }: { eventId: string; recipeId: string }) =>
      partyEventsService.claimRecipe(eventId, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.recipes(variables.eventId) });
    },
  });
}

export function useUnclaimRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, recipeId }: { eventId: string; recipeId: string }) =>
      partyEventsService.unclaimRecipe(eventId, recipeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.recipes(variables.eventId) });
    },
  });
}

// ==================== ASSIGNMENTS ====================

export function useEventAssignments(eventId: string) {
  return useQuery({
    queryKey: partyEventKeys.assignments(eventId),
    queryFn: () => partyEventsService.getAssignments(eventId),
    enabled: !!eventId,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, dto }: { eventId: string; dto: CreateAssignmentDto }) =>
      partyEventsService.createAssignment(eventId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.assignments(variables.eventId) });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventId,
      assignmentId,
      dto,
    }: {
      eventId: string;
      assignmentId: string;
      dto: UpdateAssignmentDto;
    }) => partyEventsService.updateAssignment(eventId, assignmentId, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.assignments(variables.eventId) });
    },
  });
}

export function useClaimAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, assignmentId }: { eventId: string; assignmentId: string }) =>
      partyEventsService.claimAssignment(eventId, assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.assignments(variables.eventId) });
    },
  });
}

export function useCompleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, assignmentId }: { eventId: string; assignmentId: string }) =>
      partyEventsService.completeAssignment(eventId, assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: partyEventKeys.assignments(variables.eventId) });
    },
  });
}

// ==================== SHOPPING LIST ====================

export function useEventShoppingList(eventId: string) {
  return useQuery({
    queryKey: partyEventKeys.shoppingList(eventId),
    queryFn: () => partyEventsService.getShoppingList(eventId),
    enabled: !!eventId,
  });
}

export function useGenerateShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => partyEventsService.generateShoppingList(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.shoppingList(eventId) });
    },
  });
}

export function useToggleShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, itemId }: { eventId: string; itemId: string }) =>
      partyEventsService.toggleShoppingItem(eventId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: partyEventKeys.shoppingList(variables.eventId) });
    },
  });
}

// ==================== UTILITY FUNCTIONS ====================

export function getRsvpStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Going',
    DECLINED: 'Not Going',
    MAYBE: 'Maybe',
  };
  return labels[status] || status;
}

export function getRsvpStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'text-yellow-600 bg-yellow-100',
    ACCEPTED: 'text-green-600 bg-green-100',
    DECLINED: 'text-red-600 bg-red-100',
    MAYBE: 'text-blue-600 bg-blue-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

export function getEventStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

export function getEventStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'text-gray-600 bg-gray-100',
    ACTIVE: 'text-green-600 bg-green-100',
    COMPLETED: 'text-blue-600 bg-blue-100',
    CANCELLED: 'text-red-600 bg-red-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

export function getMemberRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    HOST: 'Host',
    CO_HOST: 'Co-Host',
    CONTRIBUTOR: 'Contributor',
    GUEST: 'Guest',
  };
  return labels[role] || role;
}

export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getCountdown(eventDate: string): { days: number; hours: number; isPast: boolean } {
  const now = new Date();
  const event = new Date(eventDate);
  const diff = event.getTime() - now.getTime();

  if (diff < 0) {
    return { days: 0, hours: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { days, hours, isPast: false };
}
