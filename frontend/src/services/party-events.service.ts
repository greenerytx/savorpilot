import { api } from './api';

// ==================== ENUMS ====================

export enum EventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RsvpStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  MAYBE = 'MAYBE',
}

export enum EventMemberRole {
  HOST = 'HOST',
  CO_HOST = 'CO_HOST',
  CONTRIBUTOR = 'CONTRIBUTOR',
  GUEST = 'GUEST',
}

// ==================== INTERFACES ====================

export interface PartyEventMember {
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  email?: string;
  isVirtual: boolean;
  role: EventMemberRole;
  rsvpStatus: RsvpStatus;
  rsvpNote?: string;
  avatarEmoji?: string;
  dietaryNotes?: string;
  restrictions: string[];
  allergens: string[];
  invitedAt: string;
  respondedAt?: string;
}

export interface PartyEventRecipe {
  id: string;
  eventId: string;
  recipeId: string;
  addedById: string;
  claimedById?: string;
  category?: string;
  servings: number;
  notes?: string;
  addedAt: string;
  claimedAt?: string;
  claimedBy?: PartyEventMember;
  recipe?: {
    id: string;
    title: string;
    imageUrl?: string;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    servings: number;
  };
}

export interface PartyEventAssignment {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  assignedToId?: string;
  isCompleted: boolean;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  assignedTo?: PartyEventMember;
}

export interface CircleSummary {
  id: string;
  name: string;
  emoji?: string;
  memberCount: number;
}

export interface PartyEvent {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  coverImage?: string;
  eventDate: string;
  eventEndDate?: string;
  location?: string;
  inviteCode: string;
  isPublic: boolean;
  status: EventStatus;
  ownerId: string;
  circleId?: string;
  circle?: CircleSummary;
  memberCount: number;
  recipeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartyEventDetail extends PartyEvent {
  members?: PartyEventMember[];
  recipes?: PartyEventRecipe[];
  assignments?: PartyEventAssignment[];
}

export interface DietaryInfo {
  restrictions: string[];
  allergens: string[];
  summary: string;
}

export interface EventOptions {
  emojis: string[];
  categories: string[];
  rsvpStatuses: RsvpStatus[];
  memberRoles: EventMemberRole[];
  eventStatuses: EventStatus[];
}

// ==================== DTOs ====================

export interface CreatePartyEventDto {
  name: string;
  description?: string;
  emoji?: string;
  coverImage?: string;
  eventDate: string;
  eventEndDate?: string;
  location?: string;
  isPublic?: boolean;
  circleId?: string;
  importCircleMembers?: boolean;
}

export interface RecipeCompatibility {
  compatible: boolean;
  issues: Array<{
    type: 'restriction' | 'allergen';
    item: string;
    affectedMembers: string[];
  }>;
  safeForAll: boolean;
  summary: string;
}

export interface UpdatePartyEventDto extends Partial<CreatePartyEventDto> {
  status?: EventStatus;
}

export interface InviteMemberDto {
  userId?: string;
  name?: string;
  email?: string;
  avatarEmoji?: string;
  role?: EventMemberRole;
  dietaryNotes?: string;
}

export interface UpdateMemberDto {
  name?: string;
  role?: EventMemberRole;
  avatarEmoji?: string;
  dietaryNotes?: string;
}

export interface RsvpDto {
  status: RsvpStatus;
  note?: string;
}

export interface PinRecipeDto {
  recipeId: string;
  category?: string;
  servings?: number;
  notes?: string;
}

export interface UpdatePinnedRecipeDto {
  category?: string;
  servings?: number;
  notes?: string;
}

export interface CreateAssignmentDto {
  title: string;
  description?: string;
  assignedToId?: string;
  dueDate?: string;
}

export interface UpdateAssignmentDto extends Partial<CreateAssignmentDto> {
  isCompleted?: boolean;
}

// Shopping List
export interface ShoppingListItem {
  id: string;
  ingredient: string;
  quantity: number | null;
  unit: string | null;
  isChecked: boolean;
  assignedTo?: {
    id: string;
    name: string;
    avatarEmoji?: string;
  };
}

export interface ShoppingListCategory {
  name: string;
  items: ShoppingListItem[];
}

export interface EventShoppingList {
  id: string;
  itemCount: number;
  checkedCount: number;
  categories: ShoppingListCategory[];
}

// ==================== SERVICE ====================

class PartyEventsService {
  // Events
  async getEvents(): Promise<PartyEvent[]> {
    const response = await api.get('/party-events');
    return response.data;
  }

  async getEvent(id: string): Promise<PartyEventDetail> {
    const response = await api.get(`/party-events/${id}`);
    return response.data;
  }

  async createEvent(dto: CreatePartyEventDto): Promise<PartyEvent> {
    const response = await api.post('/party-events', dto);
    return response.data;
  }

  async updateEvent(id: string, dto: UpdatePartyEventDto): Promise<PartyEvent> {
    const response = await api.put(`/party-events/${id}`, dto);
    return response.data;
  }

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/party-events/${id}`);
  }

  async getOptions(): Promise<EventOptions> {
    const response = await api.get('/party-events/options');
    return response.data;
  }

  async getCirclesForEventCreation(): Promise<CircleSummary[]> {
    const response = await api.get('/party-events/circles');
    return response.data;
  }

  async importCircleMembers(eventId: string): Promise<{ imported: number; skipped: number }> {
    const response = await api.post(`/party-events/${eventId}/import-circle-members`);
    return response.data;
  }

  async checkRecipeCompatibility(eventId: string, recipeId: string): Promise<RecipeCompatibility> {
    const response = await api.get(`/party-events/${eventId}/recipes/${recipeId}/compatibility`);
    return response.data;
  }

  // Invite Links
  async getEventByInviteCode(inviteCode: string): Promise<PartyEvent> {
    const response = await api.get(`/party-events/join/${inviteCode}`);
    return response.data;
  }

  async joinEventByInviteCode(inviteCode: string): Promise<PartyEventMember> {
    const response = await api.post(`/party-events/join/${inviteCode}`);
    return response.data;
  }

  // Members
  async getMembers(eventId: string): Promise<PartyEventMember[]> {
    const response = await api.get(`/party-events/${eventId}/members`);
    return response.data;
  }

  async inviteMember(eventId: string, dto: InviteMemberDto): Promise<PartyEventMember> {
    const response = await api.post(`/party-events/${eventId}/members`, dto);
    return response.data;
  }

  async updateMember(
    eventId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<PartyEventMember> {
    const response = await api.put(`/party-events/${eventId}/members/${memberId}`, dto);
    return response.data;
  }

  async removeMember(eventId: string, memberId: string): Promise<void> {
    await api.delete(`/party-events/${eventId}/members/${memberId}`);
  }

  async updateRsvp(eventId: string, dto: RsvpDto): Promise<PartyEventMember> {
    const response = await api.post(`/party-events/${eventId}/rsvp`, dto);
    return response.data;
  }

  async getDietaryInfo(eventId: string): Promise<DietaryInfo> {
    const response = await api.get(`/party-events/${eventId}/dietary-info`);
    return response.data;
  }

  // Recipes
  async getRecipes(eventId: string): Promise<PartyEventRecipe[]> {
    const response = await api.get(`/party-events/${eventId}/recipes`);
    return response.data;
  }

  async pinRecipe(eventId: string, dto: PinRecipeDto): Promise<PartyEventRecipe> {
    const response = await api.post(`/party-events/${eventId}/recipes`, dto);
    return response.data;
  }

  async updatePinnedRecipe(
    eventId: string,
    recipeId: string,
    dto: UpdatePinnedRecipeDto,
  ): Promise<PartyEventRecipe> {
    const response = await api.put(`/party-events/${eventId}/recipes/${recipeId}`, dto);
    return response.data;
  }

  async unpinRecipe(eventId: string, recipeId: string): Promise<void> {
    await api.delete(`/party-events/${eventId}/recipes/${recipeId}`);
  }

  async claimRecipe(eventId: string, recipeId: string): Promise<PartyEventRecipe> {
    const response = await api.post(`/party-events/${eventId}/recipes/${recipeId}/claim`);
    return response.data;
  }

  async unclaimRecipe(eventId: string, recipeId: string): Promise<PartyEventRecipe> {
    const response = await api.delete(`/party-events/${eventId}/recipes/${recipeId}/claim`);
    return response.data;
  }

  // Assignments
  async getAssignments(eventId: string): Promise<PartyEventAssignment[]> {
    const response = await api.get(`/party-events/${eventId}/assignments`);
    return response.data;
  }

  async createAssignment(
    eventId: string,
    dto: CreateAssignmentDto,
  ): Promise<PartyEventAssignment> {
    const response = await api.post(`/party-events/${eventId}/assignments`, dto);
    return response.data;
  }

  async updateAssignment(
    eventId: string,
    assignmentId: string,
    dto: UpdateAssignmentDto,
  ): Promise<PartyEventAssignment> {
    const response = await api.put(
      `/party-events/${eventId}/assignments/${assignmentId}`,
      dto,
    );
    return response.data;
  }

  async claimAssignment(
    eventId: string,
    assignmentId: string,
  ): Promise<PartyEventAssignment> {
    const response = await api.post(
      `/party-events/${eventId}/assignments/${assignmentId}/claim`,
    );
    return response.data;
  }

  async completeAssignment(
    eventId: string,
    assignmentId: string,
  ): Promise<PartyEventAssignment> {
    const response = await api.post(
      `/party-events/${eventId}/assignments/${assignmentId}/complete`,
    );
    return response.data;
  }

  // Shopping List
  async generateShoppingList(eventId: string): Promise<{ listId: string; itemCount: number }> {
    const response = await api.post(`/party-events/${eventId}/shopping-list/generate`);
    return response.data;
  }

  async getShoppingList(eventId: string): Promise<EventShoppingList | null> {
    const response = await api.get(`/party-events/${eventId}/shopping-list`);
    return response.data;
  }

  async toggleShoppingItem(eventId: string, itemId: string): Promise<{ isChecked: boolean }> {
    const response = await api.post(`/party-events/${eventId}/shopping-list/${itemId}/toggle`);
    return response.data;
  }
}

export const partyEventsService = new PartyEventsService();
