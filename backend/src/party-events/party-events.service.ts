import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventMemberRole, RsvpStatus, EventStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import {
  CreatePartyEventDto,
  UpdatePartyEventDto,
  InviteMemberDto,
  UpdateEventMemberDto,
  RsvpDto,
  PinRecipeDto,
  UpdatePinnedRecipeDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  PartyEventResponseDto,
  PartyEventDetailResponseDto,
  PartyEventMemberResponseDto,
  PartyEventRecipeResponseDto,
  PartyEventAssignmentResponseDto,
} from './dto';

@Injectable()
export class PartyEventsService {
  private readonly logger = new Logger(PartyEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== EVENTS ====================

  async createEvent(
    userId: string,
    dto: CreatePartyEventDto,
  ): Promise<PartyEventResponseDto> {
    // Get user info for host member
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    // Validate circle if provided
    let circle = null;
    if (dto.circleId) {
      circle = await this.prisma.dinnerCircle.findFirst({
        where: { id: dto.circleId, ownerId: userId },
        include: { members: true, _count: { select: { members: true } } },
      });
      if (!circle) {
        throw new BadRequestException('Circle not found or not owned by you');
      }
    }

    const event = await this.prisma.partyEvent.create({
      data: {
        name: dto.name,
        description: dto.description,
        emoji: dto.emoji || circle?.emoji || '🎉',
        coverImage: dto.coverImage,
        eventDate: new Date(dto.eventDate),
        eventEndDate: dto.eventEndDate ? new Date(dto.eventEndDate) : null,
        location: dto.location,
        inviteCode: nanoid(10),
        isPublic: dto.isPublic ?? false,
        status: EventStatus.DRAFT,
        ownerId: userId,
        circleId: dto.circleId || null,
        members: {
          create: {
            userId: userId,
            name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Host',
            email: user?.email,
            role: EventMemberRole.HOST,
            rsvpStatus: RsvpStatus.ACCEPTED,
            isVirtual: false,
            respondedAt: new Date(),
          },
        },
      },
      include: {
        members: true,
        recipes: true,
        circle: { include: { _count: { select: { members: true } } } },
        _count: { select: { members: true, recipes: true } },
      },
    });

    // Auto-import circle members if requested
    if (dto.importCircleMembers && circle && circle.members.length > 0) {
      await this.importCircleMembersInternal(event.id, circle.members, userId);
    }

    // Refetch event with updated member count
    const updatedEvent = await this.prisma.partyEvent.findUnique({
      where: { id: event.id },
      include: {
        circle: { include: { _count: { select: { members: true } } } },
        _count: { select: { members: true, recipes: true } },
      },
    });

    return this.mapEventToResponse(updatedEvent);
  }

  async getUserEvents(userId: string): Promise<PartyEventResponseDto[]> {
    const events = await this.prisma.partyEvent.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } },
        ],
      },
      include: {
        circle: { include: { _count: { select: { members: true } } } },
        _count: { select: { members: true, recipes: true } },
      },
      orderBy: { eventDate: 'asc' },
    });

    return events.map((e) => this.mapEventToResponse(e));
  }

  async getEvent(
    userId: string,
    eventId: string,
  ): Promise<PartyEventDetailResponseDto> {
    const event = await this.prisma.partyEvent.findUnique({
      where: { id: eventId },
      include: {
        members: { orderBy: { invitedAt: 'asc' } },
        recipes: {
          include: {
            claimedBy: true,
          },
        },
        assignments: {
          include: { assignedTo: true },
          orderBy: { createdAt: 'asc' },
        },
        circle: { include: { _count: { select: { members: true } } } },
        _count: { select: { members: true, recipes: true } },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check access
    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    return this.mapEventToDetailResponse(event);
  }

  async updateEvent(
    userId: string,
    eventId: string,
    dto: UpdatePartyEventDto,
  ): Promise<PartyEventResponseDto> {
    const event = await this.prisma.partyEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canModify = await this.canModifyEvent(userId, eventId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to modify this event');
    }

    const updated = await this.prisma.partyEvent.update({
      where: { id: eventId },
      data: {
        name: dto.name,
        description: dto.description,
        emoji: dto.emoji,
        coverImage: dto.coverImage,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        eventEndDate: dto.eventEndDate ? new Date(dto.eventEndDate) : undefined,
        location: dto.location,
        isPublic: dto.isPublic,
        status: dto.status,
      },
      include: {
        _count: { select: { members: true, recipes: true } },
      },
    });

    return this.mapEventToResponse(updated);
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const event = await this.prisma.partyEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== userId) {
      throw new ForbiddenException('Only the host can delete this event');
    }

    await this.prisma.partyEvent.delete({
      where: { id: eventId },
    });
  }

  // ==================== MEMBERS ====================

  async inviteMember(
    userId: string,
    eventId: string,
    dto: InviteMemberDto,
  ): Promise<PartyEventMemberResponseDto> {
    const canModify = await this.canModifyEvent(userId, eventId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to invite members');
    }

    // If inviting an existing user
    if (dto.userId) {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: dto.userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
      if (!existingUser) {
        throw new BadRequestException('User not found');
      }

      // Check if already a member
      const existingMember = await this.prisma.partyEventMember.findFirst({
        where: { eventId, userId: dto.userId },
      });
      if (existingMember) {
        throw new BadRequestException('User is already a member of this event');
      }

      const member = await this.prisma.partyEventMember.create({
        data: {
          eventId,
          userId: dto.userId,
          name: `${existingUser.firstName} ${existingUser.lastName}`.trim() || existingUser.email,
          email: existingUser.email,
          avatarEmoji: dto.avatarEmoji || '👤',
          role: dto.role || EventMemberRole.GUEST,
          rsvpStatus: RsvpStatus.PENDING,
          isVirtual: false,
          dietaryNotes: dto.dietaryNotes,
        },
      });

      return this.mapMemberToResponse(member);
    }

    // Virtual guest invitation (name is required)
    if (!dto.name) {
      throw new BadRequestException('Name is required for virtual guests');
    }

    // Check for duplicate email
    if (dto.email) {
      const existing = await this.prisma.partyEventMember.findFirst({
        where: { eventId, email: dto.email },
      });
      if (existing) {
        throw new BadRequestException('Member with this email already invited');
      }
    }

    const member = await this.prisma.partyEventMember.create({
      data: {
        eventId,
        name: dto.name,
        email: dto.email,
        avatarEmoji: dto.avatarEmoji || '👤',
        role: dto.role || EventMemberRole.GUEST,
        rsvpStatus: RsvpStatus.PENDING,
        isVirtual: true,
        dietaryNotes: dto.dietaryNotes,
      },
    });

    return this.mapMemberToResponse(member);
  }

  async getEventMembers(
    userId: string,
    eventId: string,
  ): Promise<PartyEventMemberResponseDto[]> {
    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    const members = await this.prisma.partyEventMember.findMany({
      where: { eventId },
      orderBy: [{ role: 'asc' }, { invitedAt: 'asc' }],
    });

    return members.map((m) => this.mapMemberToResponse(m));
  }

  async updateMember(
    userId: string,
    eventId: string,
    memberId: string,
    dto: UpdateEventMemberDto,
  ): Promise<PartyEventMemberResponseDto> {
    const canModify = await this.canModifyEvent(userId, eventId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to modify members');
    }

    const member = await this.prisma.partyEventMember.findFirst({
      where: { id: memberId, eventId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Can't change host's role
    if (member.role === EventMemberRole.HOST && dto.role && dto.role !== EventMemberRole.HOST) {
      throw new BadRequestException('Cannot change host role');
    }

    const updated = await this.prisma.partyEventMember.update({
      where: { id: memberId },
      data: {
        name: dto.name,
        role: dto.role,
        avatarEmoji: dto.avatarEmoji,
        dietaryNotes: dto.dietaryNotes,
      },
    });

    return this.mapMemberToResponse(updated);
  }

  async removeMember(
    userId: string,
    eventId: string,
    memberId: string,
  ): Promise<void> {
    const canModify = await this.canModifyEvent(userId, eventId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to remove members');
    }

    const member = await this.prisma.partyEventMember.findFirst({
      where: { id: memberId, eventId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === EventMemberRole.HOST) {
      throw new BadRequestException('Cannot remove the event host');
    }

    await this.prisma.partyEventMember.delete({
      where: { id: memberId },
    });
  }

  async updateRsvp(
    userId: string,
    eventId: string,
    dto: RsvpDto,
  ): Promise<PartyEventMemberResponseDto> {
    const member = await this.prisma.partyEventMember.findFirst({
      where: { eventId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this event');
    }

    const updated = await this.prisma.partyEventMember.update({
      where: { id: member.id },
      data: {
        rsvpStatus: dto.status,
        rsvpNote: dto.note,
        respondedAt: new Date(),
      },
    });

    return this.mapMemberToResponse(updated);
  }

  async getEventDietaryInfo(
    userId: string,
    eventId: string,
  ): Promise<{ restrictions: string[]; allergens: string[]; summary: string }> {
    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    // Only consider members who have accepted
    const members = await this.prisma.partyEventMember.findMany({
      where: { eventId, rsvpStatus: RsvpStatus.ACCEPTED },
      select: { name: true, restrictions: true, allergens: true },
    });

    const allRestrictions = new Set<string>();
    const allAllergens = new Set<string>();

    for (const member of members) {
      member.restrictions.forEach((r) => allRestrictions.add(r));
      member.allergens.forEach((a) => allAllergens.add(a));
    }

    const summaryParts: string[] = [];
    if (allRestrictions.size > 0) {
      summaryParts.push(`Avoid: ${Array.from(allRestrictions).join(', ')}`);
    }
    if (allAllergens.size > 0) {
      summaryParts.push(`Allergies: ${Array.from(allAllergens).join(', ')}`);
    }

    return {
      restrictions: Array.from(allRestrictions),
      allergens: Array.from(allAllergens),
      summary: summaryParts.length > 0 ? summaryParts.join('. ') : 'No restrictions',
    };
  }

  // ==================== RECIPES ====================

  async pinRecipe(
    userId: string,
    eventId: string,
    dto: PinRecipeDto,
  ): Promise<PartyEventRecipeResponseDto> {
    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    // Check role - GUEST can't pin
    const member = await this.getMemberByUserId(eventId, userId);
    if (!member || member.role === EventMemberRole.GUEST) {
      throw new ForbiddenException('Guests cannot pin recipes');
    }

    // Check recipe exists
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Check not already pinned
    const existing = await this.prisma.partyEventRecipe.findFirst({
      where: { eventId, recipeId: dto.recipeId },
    });

    if (existing) {
      throw new BadRequestException('Recipe already pinned to this event');
    }

    const pinned = await this.prisma.partyEventRecipe.create({
      data: {
        eventId,
        recipeId: dto.recipeId,
        addedById: member.id,
        category: dto.category,
        servings: dto.servings || recipe.servings,
        notes: dto.notes,
      },
      include: {
        claimedBy: true,
      },
    });

    return this.mapRecipeToResponse(pinned, recipe);
  }

  async getEventRecipes(
    userId: string,
    eventId: string,
  ): Promise<PartyEventRecipeResponseDto[]> {
    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    const pinnedRecipes = await this.prisma.partyEventRecipe.findMany({
      where: { eventId },
      include: { claimedBy: true },
      orderBy: { addedAt: 'asc' },
    });

    // Fetch recipe details
    const recipeIds = pinnedRecipes.map((r) => r.recipeId);
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        servings: true,
      },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    return pinnedRecipes.map((pr) =>
      this.mapRecipeToResponse(pr, recipeMap.get(pr.recipeId)),
    );
  }

  async updatePinnedRecipe(
    userId: string,
    eventId: string,
    recipeId: string,
    dto: UpdatePinnedRecipeDto,
  ): Promise<PartyEventRecipeResponseDto> {
    const canModify = await this.canModifyEvent(userId, eventId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to update recipes');
    }

    const pinned = await this.prisma.partyEventRecipe.findFirst({
      where: { eventId, recipeId },
    });

    if (!pinned) {
      throw new NotFoundException('Recipe not pinned to this event');
    }

    const updated = await this.prisma.partyEventRecipe.update({
      where: { id: pinned.id },
      data: {
        category: dto.category,
        servings: dto.servings,
        notes: dto.notes,
      },
      include: { claimedBy: true },
    });

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        servings: true,
      },
    });

    return this.mapRecipeToResponse(updated, recipe);
  }

  async unpinRecipe(
    userId: string,
    eventId: string,
    recipeId: string,
  ): Promise<void> {
    const canModify = await this.canModifyEvent(userId, eventId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to remove recipes');
    }

    const pinned = await this.prisma.partyEventRecipe.findFirst({
      where: { eventId, recipeId },
    });

    if (!pinned) {
      throw new NotFoundException('Recipe not pinned to this event');
    }

    await this.prisma.partyEventRecipe.delete({
      where: { id: pinned.id },
    });
  }

  async claimRecipe(
    userId: string,
    eventId: string,
    recipeId: string,
  ): Promise<PartyEventRecipeResponseDto> {
    const member = await this.getMemberByUserId(eventId, userId);
    if (!member) {
      throw new ForbiddenException('Not a member of this event');
    }

    const pinned = await this.prisma.partyEventRecipe.findFirst({
      where: { eventId, recipeId },
    });

    if (!pinned) {
      throw new NotFoundException('Recipe not pinned to this event');
    }

    if (pinned.claimedById) {
      throw new BadRequestException('Recipe already claimed by someone');
    }

    const updated = await this.prisma.partyEventRecipe.update({
      where: { id: pinned.id },
      data: {
        claimedById: member.id,
        claimedAt: new Date(),
      },
      include: { claimedBy: true },
    });

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        servings: true,
      },
    });

    return this.mapRecipeToResponse(updated, recipe);
  }

  async unclaimRecipe(
    userId: string,
    eventId: string,
    recipeId: string,
  ): Promise<PartyEventRecipeResponseDto> {
    const member = await this.getMemberByUserId(eventId, userId);
    if (!member) {
      throw new ForbiddenException('Not a member of this event');
    }

    const pinned = await this.prisma.partyEventRecipe.findFirst({
      where: { eventId, recipeId },
    });

    if (!pinned) {
      throw new NotFoundException('Recipe not pinned to this event');
    }

    // Can only unclaim own claim (or host can unclaim anyone)
    const canModify = await this.canModifyEvent(userId, eventId);
    if (pinned.claimedById !== member.id && !canModify) {
      throw new ForbiddenException('Can only unclaim your own recipes');
    }

    const updated = await this.prisma.partyEventRecipe.update({
      where: { id: pinned.id },
      data: {
        claimedById: null,
        claimedAt: null,
      },
      include: { claimedBy: true },
    });

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prepTimeMinutes: true,
        cookTimeMinutes: true,
        servings: true,
      },
    });

    return this.mapRecipeToResponse(updated, recipe);
  }

  // ==================== ASSIGNMENTS ====================

  async createAssignment(
    userId: string,
    eventId: string,
    dto: CreateAssignmentDto,
  ): Promise<PartyEventAssignmentResponseDto> {
    const canModify = await this.canModifyEvent(userId, eventId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to create assignments');
    }

    const assignment = await this.prisma.partyEventAssignment.create({
      data: {
        eventId,
        title: dto.title,
        description: dto.description,
        assignedToId: dto.assignedToId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: { assignedTo: true },
    });

    return this.mapAssignmentToResponse(assignment);
  }

  async getEventAssignments(
    userId: string,
    eventId: string,
  ): Promise<PartyEventAssignmentResponseDto[]> {
    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    const assignments = await this.prisma.partyEventAssignment.findMany({
      where: { eventId },
      include: { assignedTo: true },
      orderBy: [{ isCompleted: 'asc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
    });

    return assignments.map((a) => this.mapAssignmentToResponse(a));
  }

  async updateAssignment(
    userId: string,
    eventId: string,
    assignmentId: string,
    dto: UpdateAssignmentDto,
  ): Promise<PartyEventAssignmentResponseDto> {
    const canModify = await this.canModifyEvent(userId, eventId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to update assignments');
    }

    const assignment = await this.prisma.partyEventAssignment.findFirst({
      where: { id: assignmentId, eventId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const updated = await this.prisma.partyEventAssignment.update({
      where: { id: assignmentId },
      data: {
        title: dto.title,
        description: dto.description,
        assignedToId: dto.assignedToId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        isCompleted: dto.isCompleted,
        completedAt: dto.isCompleted ? new Date() : null,
      },
      include: { assignedTo: true },
    });

    return this.mapAssignmentToResponse(updated);
  }

  async claimAssignment(
    userId: string,
    eventId: string,
    assignmentId: string,
  ): Promise<PartyEventAssignmentResponseDto> {
    const member = await this.getMemberByUserId(eventId, userId);
    if (!member) {
      throw new ForbiddenException('Not a member of this event');
    }

    const assignment = await this.prisma.partyEventAssignment.findFirst({
      where: { id: assignmentId, eventId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.assignedToId) {
      throw new BadRequestException('Assignment already claimed');
    }

    const updated = await this.prisma.partyEventAssignment.update({
      where: { id: assignmentId },
      data: { assignedToId: member.id },
      include: { assignedTo: true },
    });

    return this.mapAssignmentToResponse(updated);
  }

  async completeAssignment(
    userId: string,
    eventId: string,
    assignmentId: string,
  ): Promise<PartyEventAssignmentResponseDto> {
    const member = await this.getMemberByUserId(eventId, userId);
    if (!member) {
      throw new ForbiddenException('Not a member of this event');
    }

    const assignment = await this.prisma.partyEventAssignment.findFirst({
      where: { id: assignmentId, eventId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Only assignee or host can complete
    const canModify = await this.canModifyEvent(userId, eventId);
    if (assignment.assignedToId !== member.id && !canModify) {
      throw new ForbiddenException('Only the assignee can complete this');
    }

    const updated = await this.prisma.partyEventAssignment.update({
      where: { id: assignmentId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
      include: { assignedTo: true },
    });

    return this.mapAssignmentToResponse(updated);
  }

  // ==================== INVITE LINKS ====================

  async getEventByInviteCode(
    inviteCode: string,
  ): Promise<PartyEventResponseDto> {
    const event = await this.prisma.partyEvent.findUnique({
      where: { inviteCode },
      include: {
        _count: { select: { members: true, recipes: true } },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.mapEventToResponse(event);
  }

  async joinEventByInviteCode(
    userId: string,
    inviteCode: string,
  ): Promise<PartyEventMemberResponseDto> {
    const event = await this.prisma.partyEvent.findUnique({
      where: { inviteCode },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if already a member
    const existing = await this.prisma.partyEventMember.findFirst({
      where: { eventId: event.id, userId },
    });

    if (existing) {
      throw new BadRequestException('Already a member of this event');
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    const member = await this.prisma.partyEventMember.create({
      data: {
        eventId: event.id,
        userId,
        name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest',
        email: user?.email,
        role: EventMemberRole.CONTRIBUTOR,
        rsvpStatus: RsvpStatus.ACCEPTED,
        isVirtual: false,
        respondedAt: new Date(),
      },
    });

    return this.mapMemberToResponse(member);
  }

  // ==================== OPTIONS ====================

  getOptions(): {
    emojis: string[];
    categories: string[];
    rsvpStatuses: RsvpStatus[];
    memberRoles: EventMemberRole[];
    eventStatuses: EventStatus[];
  } {
    return {
      emojis: [
        '🦃', '🎃', '🎄', '🎊', '🎉',
        '🍗', '🥘', '🍖', '🌮', '🍕',
        '🎂', '🎈', '🏠', '🌴', '⛺',
        '🔥', '🌙', '☀️', '🌸', '🍂',
      ],
      categories: [
        'Appetizer',
        'Main Course',
        'Side Dish',
        'Dessert',
        'Beverage',
        'Bread',
        'Salad',
        'Soup',
        'Other',
      ],
      rsvpStatuses: Object.values(RsvpStatus),
      memberRoles: Object.values(EventMemberRole),
      eventStatuses: Object.values(EventStatus),
    };
  }

  // ==================== CIRCLE INTEGRATION ====================

  async importCircleMembers(
    userId: string,
    eventId: string,
  ): Promise<{ imported: number; skipped: number }> {
    const event = await this.prisma.partyEvent.findUnique({
      where: { id: eventId },
      include: { members: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const canModify = await this.canModifyEvent(userId, eventId);
    if (!canModify) {
      throw new ForbiddenException('Not authorized to import members');
    }

    if (!event.circleId) {
      throw new BadRequestException('Event is not linked to a circle');
    }

    const circle = await this.prisma.dinnerCircle.findUnique({
      where: { id: event.circleId },
      include: { members: true },
    });

    if (!circle) {
      throw new NotFoundException('Linked circle not found');
    }

    const result = await this.importCircleMembersInternal(eventId, circle.members, userId);
    return result;
  }

  private async importCircleMembersInternal(
    eventId: string,
    circleMembers: any[],
    hostUserId: string,
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    // Get existing event members
    const existingMembers = await this.prisma.partyEventMember.findMany({
      where: { eventId },
      select: { userId: true, email: true },
    });

    const existingUserIds = new Set(existingMembers.filter(m => m.userId).map(m => m.userId));
    const existingEmails = new Set(existingMembers.filter(m => m.email).map(m => m.email?.toLowerCase()));

    for (const circleMember of circleMembers) {
      // Skip the host (they're already a member)
      if (circleMember.userId === hostUserId) {
        skipped++;
        continue;
      }

      // Skip if already a member by userId
      if (circleMember.userId && existingUserIds.has(circleMember.userId)) {
        skipped++;
        continue;
      }

      // Get user email if linked to a user
      let memberEmail: string | null = null;
      if (circleMember.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: circleMember.userId },
          select: { email: true },
        });
        memberEmail = user?.email || null;
      }

      // Skip if already a member by email
      if (memberEmail && existingEmails.has(memberEmail.toLowerCase())) {
        skipped++;
        continue;
      }

      // Create the event member from circle member
      await this.prisma.partyEventMember.create({
        data: {
          eventId,
          userId: circleMember.userId,
          name: circleMember.name,
          email: memberEmail,
          isVirtual: circleMember.isVirtual,
          role: EventMemberRole.GUEST,
          rsvpStatus: RsvpStatus.PENDING,
          avatarEmoji: circleMember.avatarEmoji || '👤',
          dietaryNotes: circleMember.dietaryNotes,
          restrictions: circleMember.restrictions || [],
          allergens: circleMember.allergens || [],
        },
      });

      imported++;
    }

    return { imported, skipped };
  }

  async getCirclesForEventCreation(userId: string): Promise<any[]> {
    const circles = await this.prisma.dinnerCircle.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    });

    return circles.map(c => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      memberCount: c._count.members,
    }));
  }

  // ==================== SHOPPING LIST ====================

  async generateShoppingList(
    userId: string,
    eventId: string,
  ): Promise<{ listId: string; itemCount: number }> {
    const event = await this.prisma.partyEvent.findUnique({
      where: { id: eventId },
      include: {
        recipes: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    if (event.recipes.length === 0) {
      throw new BadRequestException('No recipes pinned to this event');
    }

    // Fetch all recipe details with components
    const recipeIds = event.recipes.map(r => r.recipeId);
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: {
        id: true,
        title: true,
        components: true,
        servings: true,
      },
    });

    // Build ingredient map (aggregating quantities)
    const ingredientMap = new Map<string, {
      quantity: number;
      unit: string;
      category: string;
      recipeIds: string[];
    }>();

    for (const eventRecipe of event.recipes) {
      const recipe = recipes.find(r => r.id === eventRecipe.recipeId);
      if (!recipe) continue;

      const servingRatio = eventRecipe.servings / (recipe.servings || 4);
      const components = recipe.components as any[];

      if (!Array.isArray(components)) continue;

      for (const component of components) {
        if (!component.ingredients || !Array.isArray(component.ingredients)) continue;

        for (const ing of component.ingredients) {
          if (!ing.name) continue;

          const key = ing.name.toLowerCase().trim();
          const existing = ingredientMap.get(key);

          // Parse quantity
          const quantity = (ing.quantity || 1) * servingRatio;
          const unit = ing.unit || '';
          const category = this.categorizeIngredient(ing.name);

          if (existing && existing.unit === unit) {
            existing.quantity += quantity;
            if (!existing.recipeIds.includes(recipe.id)) {
              existing.recipeIds.push(recipe.id);
            }
          } else {
            ingredientMap.set(key, {
              quantity,
              unit,
              category,
              recipeIds: [recipe.id],
            });
          }
        }
      }
    }

    // Create or update shopping list
    let shoppingList = await this.prisma.partyEventShoppingList.findUnique({
      where: { eventId },
    });

    if (shoppingList) {
      // Clear existing items
      await this.prisma.partyEventShoppingItem.deleteMany({
        where: { shoppingListId: shoppingList.id },
      });
    } else {
      // Create new list
      shoppingList = await this.prisma.partyEventShoppingList.create({
        data: { eventId },
      });
    }

    // Add all items
    const items = Array.from(ingredientMap.entries()).map(([name, data]) => ({
      shoppingListId: shoppingList!.id,
      ingredient: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: Math.round(data.quantity * 100) / 100,
      unit: data.unit || null,
      category: data.category,
      isChecked: false,
      recipeId: data.recipeIds[0] || null,
    }));

    await this.prisma.partyEventShoppingItem.createMany({
      data: items,
    });

    return {
      listId: shoppingList.id,
      itemCount: items.length,
    };
  }

  async getEventShoppingList(userId: string, eventId: string) {
    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    const shoppingList = await this.prisma.partyEventShoppingList.findUnique({
      where: { eventId },
      include: {
        items: {
          include: { assignedTo: true },
          orderBy: [{ category: 'asc' }, { ingredient: 'asc' }],
        },
      },
    });

    if (!shoppingList) {
      return null;
    }

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const item of shoppingList.items) {
      const cat = item.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        id: item.id,
        ingredient: item.ingredient,
        quantity: item.quantity,
        unit: item.unit,
        isChecked: item.isChecked,
        assignedTo: item.assignedTo ? {
          id: item.assignedTo.id,
          name: item.assignedTo.name,
          avatarEmoji: item.assignedTo.avatarEmoji,
        } : undefined,
      });
    }

    return {
      id: shoppingList.id,
      itemCount: shoppingList.items.length,
      checkedCount: shoppingList.items.filter(i => i.isChecked).length,
      categories: Object.entries(grouped).map(([name, items]) => ({
        name,
        items,
      })),
    };
  }

  async toggleShoppingItem(
    userId: string,
    eventId: string,
    itemId: string,
  ): Promise<{ isChecked: boolean }> {
    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    const item = await this.prisma.partyEventShoppingItem.findUnique({
      where: { id: itemId },
      include: { shoppingList: true },
    });

    if (!item || item.shoppingList.eventId !== eventId) {
      throw new NotFoundException('Item not found');
    }

    const updated = await this.prisma.partyEventShoppingItem.update({
      where: { id: itemId },
      data: { isChecked: !item.isChecked },
    });

    return { isChecked: updated.isChecked };
  }

  private categorizeIngredient(name: string): string {
    const nameLower = name.toLowerCase();

    const categoryPatterns: Record<string, string[]> = {
      Produce: ['onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'pepper', 'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'cucumber', 'zucchini', 'squash', 'mushroom', 'lemon', 'lime', 'orange', 'apple', 'banana', 'berry', 'avocado', 'herb', 'cilantro', 'parsley', 'basil', 'mint', 'rosemary', 'thyme', 'ginger', 'scallion', 'leek', 'cabbage', 'corn'],
      Meat: ['beef', 'chicken', 'pork', 'lamb', 'turkey', 'bacon', 'ham', 'sausage', 'steak', 'ground', 'meat', 'wing', 'thigh', 'breast', 'rib'],
      Seafood: ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster', 'cod', 'tilapia', 'halibut', 'anchovy'],
      Dairy: ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'sour cream', 'egg', 'half and half'],
      Bakery: ['bread', 'roll', 'bun', 'tortilla', 'pita', 'naan', 'croissant', 'bagel'],
      Pantry: ['flour', 'sugar', 'salt', 'oil', 'vinegar', 'sauce', 'paste', 'can', 'bean', 'rice', 'pasta', 'noodle', 'stock', 'broth', 'honey', 'syrup', 'spice', 'seasoning', 'pepper', 'cumin', 'paprika', 'cinnamon', 'nutmeg', 'vanilla', 'baking', 'yeast', 'cornstarch', 'soy sauce', 'worcestershire'],
      Frozen: ['frozen', 'ice cream'],
      Beverages: ['wine', 'beer', 'juice', 'water', 'soda', 'coffee', 'tea'],
    };

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some(p => nameLower.includes(p))) {
        return category;
      }
    }

    return 'Other';
  }

  // ==================== DIETARY COMPATIBILITY ====================

  async checkRecipeCompatibility(
    userId: string,
    eventId: string,
    recipeId: string,
  ): Promise<{
    compatible: boolean;
    issues: Array<{
      type: 'restriction' | 'allergen';
      item: string;
      affectedMembers: string[];
    }>;
    safeForAll: boolean;
    summary: string;
  }> {
    const hasAccess = await this.checkEventAccess(userId, eventId);
    if (!hasAccess) {
      throw new ForbiddenException('Not a member of this event');
    }

    // Get event members who have accepted (and their dietary info)
    const members = await this.prisma.partyEventMember.findMany({
      where: { eventId, rsvpStatus: RsvpStatus.ACCEPTED },
      select: {
        name: true,
        restrictions: true,
        allergens: true,
      },
    });

    // Get recipe with ingredients
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
        components: true,
        allergens: { include: { allergen: true } },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const issues: Array<{
      type: 'restriction' | 'allergen';
      item: string;
      affectedMembers: string[];
    }> = [];

    // Get all ingredients from recipe components
    const ingredients = this.extractIngredientsFromComponents(recipe.components as any);
    const ingredientsLower = ingredients.map(i => i.toLowerCase());

    // Check against each member's restrictions and allergens
    for (const member of members) {
      // Check restrictions
      for (const restriction of member.restrictions) {
        if (this.ingredientMatchesRestriction(ingredientsLower, restriction)) {
          const existing = issues.find(
            i => i.type === 'restriction' && i.item === restriction,
          );
          if (existing) {
            existing.affectedMembers.push(member.name);
          } else {
            issues.push({
              type: 'restriction',
              item: restriction,
              affectedMembers: [member.name],
            });
          }
        }
      }

      // Check allergens
      for (const allergen of member.allergens) {
        if (this.ingredientMatchesAllergen(ingredientsLower, allergen)) {
          const existing = issues.find(
            i => i.type === 'allergen' && i.item === allergen,
          );
          if (existing) {
            existing.affectedMembers.push(member.name);
          } else {
            issues.push({
              type: 'allergen',
              item: allergen,
              affectedMembers: [member.name],
            });
          }
        }
      }
    }

    // Also check against recipe's tagged allergens
    for (const recipeAllergen of recipe.allergens) {
      const allergenName = recipeAllergen.allergen.name.toLowerCase();
      for (const member of members) {
        const memberAllergens = member.allergens.map(a => a.toLowerCase());
        if (memberAllergens.includes(allergenName)) {
          const existing = issues.find(
            i => i.type === 'allergen' && i.item.toLowerCase() === allergenName,
          );
          if (!existing) {
            issues.push({
              type: 'allergen',
              item: recipeAllergen.allergen.displayName,
              affectedMembers: [member.name],
            });
          } else if (!existing.affectedMembers.includes(member.name)) {
            existing.affectedMembers.push(member.name);
          }
        }
      }
    }

    const safeForAll = issues.length === 0;
    let summary: string;

    if (safeForAll) {
      summary = 'This recipe appears safe for all accepted guests.';
    } else {
      const allergenIssues = issues.filter(i => i.type === 'allergen');
      const restrictionIssues = issues.filter(i => i.type === 'restriction');

      const parts: string[] = [];
      if (allergenIssues.length > 0) {
        parts.push(`Contains allergens: ${allergenIssues.map(i => i.item).join(', ')}`);
      }
      if (restrictionIssues.length > 0) {
        parts.push(`May not suit: ${restrictionIssues.map(i => i.item).join(', ')}`);
      }
      summary = parts.join('. ');
    }

    return {
      compatible: issues.filter(i => i.type === 'allergen').length === 0,
      issues,
      safeForAll,
      summary,
    };
  }

  private extractIngredientsFromComponents(components: any[]): string[] {
    const ingredients: string[] = [];
    if (!Array.isArray(components)) return ingredients;

    for (const component of components) {
      if (component.ingredients && Array.isArray(component.ingredients)) {
        for (const ing of component.ingredients) {
          if (ing.name) {
            ingredients.push(ing.name);
          }
        }
      }
    }
    return ingredients;
  }

  private ingredientMatchesRestriction(
    ingredients: string[],
    restriction: string,
  ): boolean {
    const restrictionLower = restriction.toLowerCase();

    // Common restriction patterns
    const restrictionPatterns: Record<string, string[]> = {
      vegetarian: ['meat', 'beef', 'pork', 'chicken', 'turkey', 'lamb', 'bacon', 'ham', 'sausage', 'fish', 'seafood', 'shrimp', 'salmon', 'tuna', 'anchovy', 'gelatin'],
      vegan: ['meat', 'beef', 'pork', 'chicken', 'turkey', 'lamb', 'bacon', 'ham', 'sausage', 'fish', 'seafood', 'shrimp', 'salmon', 'tuna', 'anchovy', 'milk', 'cream', 'cheese', 'butter', 'egg', 'honey', 'yogurt', 'gelatin', 'whey', 'casein'],
      'gluten-free': ['wheat', 'flour', 'bread', 'pasta', 'barley', 'rye', 'oat', 'couscous', 'bulgur', 'semolina', 'soy sauce'],
      'dairy-free': ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'whey', 'casein', 'lactose', 'ghee'],
      kosher: ['pork', 'bacon', 'ham', 'shellfish', 'shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster'],
      halal: ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer', 'gelatin'],
      'low-sodium': ['salt', 'soy sauce', 'fish sauce', 'msg'],
      'low-carb': ['sugar', 'flour', 'bread', 'pasta', 'rice', 'potato', 'corn'],
      keto: ['sugar', 'flour', 'bread', 'pasta', 'rice', 'potato', 'corn', 'beans', 'fruit'],
      paleo: ['grain', 'wheat', 'flour', 'bread', 'pasta', 'rice', 'beans', 'legume', 'peanut', 'dairy', 'milk', 'cheese', 'sugar'],
    };

    const patterns = restrictionPatterns[restrictionLower];
    if (patterns) {
      return ingredients.some(ing =>
        patterns.some(pattern => ing.includes(pattern)),
      );
    }

    // Generic check - see if the restriction word appears in any ingredient
    return ingredients.some(ing => ing.includes(restrictionLower));
  }

  private ingredientMatchesAllergen(
    ingredients: string[],
    allergen: string,
  ): boolean {
    const allergenLower = allergen.toLowerCase();

    // Common allergen patterns
    const allergenPatterns: Record<string, string[]> = {
      peanut: ['peanut', 'groundnut'],
      'tree nut': ['almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'macadamia', 'hazelnut', 'brazil nut', 'chestnut', 'pine nut'],
      milk: ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'whey', 'casein', 'lactose', 'ghee'],
      dairy: ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'whey', 'casein', 'lactose', 'ghee'],
      egg: ['egg', 'mayonnaise', 'meringue', 'aioli'],
      wheat: ['wheat', 'flour', 'bread', 'pasta', 'semolina', 'couscous', 'bulgur'],
      gluten: ['wheat', 'flour', 'bread', 'pasta', 'barley', 'rye', 'oat', 'seitan'],
      soy: ['soy', 'tofu', 'tempeh', 'edamame', 'miso'],
      fish: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'mackerel', 'halibut', 'tilapia', 'trout'],
      shellfish: ['shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop', 'crawfish', 'prawn'],
      sesame: ['sesame', 'tahini'],
      sulfite: ['wine', 'dried fruit', 'sulfite'],
    };

    const patterns = allergenPatterns[allergenLower];
    if (patterns) {
      return ingredients.some(ing =>
        patterns.some(pattern => ing.includes(pattern)),
      );
    }

    // Generic check
    return ingredients.some(ing => ing.includes(allergenLower));
  }

  // ==================== HELPERS ====================

  private async checkEventAccess(
    userId: string,
    eventId: string,
  ): Promise<boolean> {
    const event = await this.prisma.partyEvent.findUnique({
      where: { id: eventId },
      include: { members: { where: { userId } } },
    });

    if (!event) return false;
    return event.ownerId === userId || event.members.length > 0;
  }

  private async canModifyEvent(
    userId: string,
    eventId: string,
  ): Promise<boolean> {
    const event = await this.prisma.partyEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) return false;
    if (event.ownerId === userId) return true;

    const member = await this.prisma.partyEventMember.findFirst({
      where: {
        eventId,
        userId,
        role: { in: [EventMemberRole.HOST, EventMemberRole.CO_HOST] },
      },
    });

    return !!member;
  }

  private async getMemberByUserId(
    eventId: string,
    userId: string,
  ): Promise<{ id: string; role: EventMemberRole } | null> {
    return this.prisma.partyEventMember.findFirst({
      where: { eventId, userId },
      select: { id: true, role: true },
    });
  }

  private mapEventToResponse(event: any): PartyEventResponseDto {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      emoji: event.emoji,
      coverImage: event.coverImage,
      eventDate: event.eventDate,
      eventEndDate: event.eventEndDate,
      location: event.location,
      inviteCode: event.inviteCode,
      isPublic: event.isPublic,
      status: event.status,
      ownerId: event.ownerId,
      circleId: event.circleId,
      circle: event.circle ? {
        id: event.circle.id,
        name: event.circle.name,
        emoji: event.circle.emoji,
        memberCount: event.circle._count?.members || 0,
      } : undefined,
      memberCount: event._count?.members || event.members?.length || 0,
      recipeCount: event._count?.recipes || event.recipes?.length || 0,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private mapEventToDetailResponse(event: any): PartyEventDetailResponseDto {
    return {
      ...this.mapEventToResponse(event),
      members: event.members?.map((m: any) => this.mapMemberToResponse(m)),
      recipes: event.recipes?.map((r: any) => this.mapRecipeToResponse(r)),
      assignments: event.assignments?.map((a: any) => this.mapAssignmentToResponse(a)),
    };
  }

  private mapMemberToResponse(member: any): PartyEventMemberResponseDto {
    return {
      id: member.id,
      eventId: member.eventId,
      userId: member.userId,
      name: member.name,
      email: member.email,
      isVirtual: member.isVirtual,
      role: member.role,
      rsvpStatus: member.rsvpStatus,
      rsvpNote: member.rsvpNote,
      avatarEmoji: member.avatarEmoji,
      dietaryNotes: member.dietaryNotes,
      restrictions: member.restrictions || [],
      allergens: member.allergens || [],
      invitedAt: member.invitedAt,
      respondedAt: member.respondedAt,
    };
  }

  private mapRecipeToResponse(
    pinned: any,
    recipe?: any,
  ): PartyEventRecipeResponseDto {
    return {
      id: pinned.id,
      eventId: pinned.eventId,
      recipeId: pinned.recipeId,
      addedById: pinned.addedById,
      claimedById: pinned.claimedById,
      category: pinned.category,
      servings: pinned.servings,
      notes: pinned.notes,
      addedAt: pinned.addedAt,
      claimedAt: pinned.claimedAt,
      claimedBy: pinned.claimedBy
        ? this.mapMemberToResponse(pinned.claimedBy)
        : undefined,
      recipe: recipe
        ? {
            id: recipe.id,
            title: recipe.title,
            imageUrl: recipe.imageUrl,
            prepTimeMinutes: recipe.prepTimeMinutes,
            cookTimeMinutes: recipe.cookTimeMinutes,
            servings: recipe.servings,
          }
        : undefined,
    };
  }

  private mapAssignmentToResponse(
    assignment: any,
  ): PartyEventAssignmentResponseDto {
    return {
      id: assignment.id,
      eventId: assignment.eventId,
      title: assignment.title,
      description: assignment.description,
      assignedToId: assignment.assignedToId,
      isCompleted: assignment.isCompleted,
      dueDate: assignment.dueDate,
      createdAt: assignment.createdAt,
      completedAt: assignment.completedAt,
      assignedTo: assignment.assignedTo
        ? this.mapMemberToResponse(assignment.assignedTo)
        : undefined,
    };
  }
}
