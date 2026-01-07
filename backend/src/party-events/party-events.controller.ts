import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PartyEventsService } from './party-events.service';
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

@ApiTags('Party Events')
@ApiBearerAuth()
@Controller('party-events')
@UseGuards(JwtAuthGuard)
export class PartyEventsController {
  constructor(private readonly partyEventsService: PartyEventsService) {}

  // ==================== EVENTS ====================

  @Post()
  @ApiOperation({ summary: 'Create a new party event' })
  @ApiResponse({ status: 201, type: PartyEventResponseDto })
  async createEvent(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePartyEventDto,
  ): Promise<PartyEventResponseDto> {
    return this.partyEventsService.createEvent(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events for the current user' })
  @ApiResponse({ status: 200, type: [PartyEventResponseDto] })
  async getUserEvents(
    @CurrentUser('id') userId: string,
  ): Promise<PartyEventResponseDto[]> {
    return this.partyEventsService.getUserEvents(userId);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get options for emojis, categories, statuses' })
  @ApiResponse({ status: 200 })
  getOptions() {
    return this.partyEventsService.getOptions();
  }

  @Get('circles')
  @ApiOperation({ summary: 'Get user circles for event creation' })
  @ApiResponse({ status: 200, description: 'List of circles available for linking to events' })
  async getCirclesForEventCreation(@CurrentUser('id') userId: string) {
    return this.partyEventsService.getCirclesForEventCreation(userId);
  }

  @Get('join/:inviteCode')
  @ApiOperation({ summary: 'Preview event by invite code' })
  @ApiResponse({ status: 200, type: PartyEventResponseDto })
  async getEventByInviteCode(
    @Param('inviteCode') inviteCode: string,
  ): Promise<PartyEventResponseDto> {
    return this.partyEventsService.getEventByInviteCode(inviteCode);
  }

  @Post('join/:inviteCode')
  @ApiOperation({ summary: 'Join event by invite code' })
  @ApiResponse({ status: 201, type: PartyEventMemberResponseDto })
  async joinEventByInviteCode(
    @CurrentUser('id') userId: string,
    @Param('inviteCode') inviteCode: string,
  ): Promise<PartyEventMemberResponseDto> {
    return this.partyEventsService.joinEventByInviteCode(userId, inviteCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific event with details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventDetailResponseDto })
  async getEvent(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<PartyEventDetailResponseDto> {
    return this.partyEventsService.getEvent(userId, eventId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventResponseDto })
  async updateEvent(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdatePartyEventDto,
  ): Promise<PartyEventResponseDto> {
    return this.partyEventsService.updateEvent(userId, eventId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteEvent(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<void> {
    return this.partyEventsService.deleteEvent(userId, eventId);
  }

  @Post(':id/import-circle-members')
  @ApiOperation({ summary: 'Import members from linked Dinner Circle' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Members imported successfully' })
  async importCircleMembers(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<{ imported: number; skipped: number }> {
    return this.partyEventsService.importCircleMembers(userId, eventId);
  }

  // ==================== MEMBERS ====================

  @Post(':id/members')
  @ApiOperation({ summary: 'Invite a member to an event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, type: PartyEventMemberResponseDto })
  async inviteMember(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<PartyEventMemberResponseDto> {
    return this.partyEventsService.inviteMember(userId, eventId, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of an event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: [PartyEventMemberResponseDto] })
  async getEventMembers(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<PartyEventMemberResponseDto[]> {
    return this.partyEventsService.getEventMembers(userId, eventId);
  }

  @Put(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a member' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventMemberResponseDto })
  async updateMember(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateEventMemberDto,
  ): Promise<PartyEventMemberResponseDto> {
    return this.partyEventsService.updateMember(userId, eventId, memberId, dto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from an event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  async removeMember(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    return this.partyEventsService.removeMember(userId, eventId, memberId);
  }

  @Post(':id/rsvp')
  @ApiOperation({ summary: 'Update your RSVP status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventMemberResponseDto })
  async updateRsvp(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: RsvpDto,
  ): Promise<PartyEventMemberResponseDto> {
    return this.partyEventsService.updateRsvp(userId, eventId, dto);
  }

  @Get(':id/dietary-info')
  @ApiOperation({ summary: 'Get combined dietary restrictions for event attendees' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200 })
  async getEventDietaryInfo(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ) {
    return this.partyEventsService.getEventDietaryInfo(userId, eventId);
  }

  // ==================== RECIPES ====================

  @Post(':id/recipes')
  @ApiOperation({ summary: 'Pin a recipe to the event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, type: PartyEventRecipeResponseDto })
  async pinRecipe(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: PinRecipeDto,
  ): Promise<PartyEventRecipeResponseDto> {
    return this.partyEventsService.pinRecipe(userId, eventId, dto);
  }

  @Get(':id/recipes')
  @ApiOperation({ summary: 'Get all pinned recipes for an event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: [PartyEventRecipeResponseDto] })
  async getEventRecipes(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<PartyEventRecipeResponseDto[]> {
    return this.partyEventsService.getEventRecipes(userId, eventId);
  }

  @Put(':id/recipes/:recipeId')
  @ApiOperation({ summary: 'Update a pinned recipe' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventRecipeResponseDto })
  async updatePinnedRecipe(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
    @Body() dto: UpdatePinnedRecipeDto,
  ): Promise<PartyEventRecipeResponseDto> {
    return this.partyEventsService.updatePinnedRecipe(userId, eventId, recipeId, dto);
  }

  @Delete(':id/recipes/:recipeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unpin a recipe from the event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid' })
  async unpinRecipe(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<void> {
    return this.partyEventsService.unpinRecipe(userId, eventId, recipeId);
  }

  @Post(':id/recipes/:recipeId/claim')
  @ApiOperation({ summary: 'Claim to make a recipe' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventRecipeResponseDto })
  async claimRecipe(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<PartyEventRecipeResponseDto> {
    return this.partyEventsService.claimRecipe(userId, eventId, recipeId);
  }

  @Get(':id/recipes/:recipeId/compatibility')
  @ApiOperation({ summary: 'Check recipe compatibility with event attendees dietary needs' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Compatibility check results' })
  async checkRecipeCompatibility(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ) {
    return this.partyEventsService.checkRecipeCompatibility(userId, eventId, recipeId);
  }

  @Delete(':id/recipes/:recipeId/claim')
  @ApiOperation({ summary: 'Unclaim a recipe' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventRecipeResponseDto })
  async unclaimRecipe(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('recipeId', ParseUUIDPipe) recipeId: string,
  ): Promise<PartyEventRecipeResponseDto> {
    return this.partyEventsService.unclaimRecipe(userId, eventId, recipeId);
  }

  // ==================== SHOPPING LIST ====================

  @Post(':id/shopping-list/generate')
  @ApiOperation({ summary: 'Generate shopping list from event recipes' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Shopping list generated' })
  async generateShoppingList(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ) {
    return this.partyEventsService.generateShoppingList(userId, eventId);
  }

  @Get(':id/shopping-list')
  @ApiOperation({ summary: 'Get event shopping list' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Event shopping list' })
  async getEventShoppingList(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ) {
    return this.partyEventsService.getEventShoppingList(userId, eventId);
  }

  @Post(':id/shopping-list/:itemId/toggle')
  @ApiOperation({ summary: 'Toggle shopping item checked status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'itemId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200 })
  async toggleShoppingItem(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.partyEventsService.toggleShoppingItem(userId, eventId, itemId);
  }

  // ==================== ASSIGNMENTS ====================

  @Post(':id/assignments')
  @ApiOperation({ summary: 'Create a task/assignment for the event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, type: PartyEventAssignmentResponseDto })
  async createAssignment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateAssignmentDto,
  ): Promise<PartyEventAssignmentResponseDto> {
    return this.partyEventsService.createAssignment(userId, eventId, dto);
  }

  @Get(':id/assignments')
  @ApiOperation({ summary: 'Get all assignments for an event' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: [PartyEventAssignmentResponseDto] })
  async getEventAssignments(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
  ): Promise<PartyEventAssignmentResponseDto[]> {
    return this.partyEventsService.getEventAssignments(userId, eventId);
  }

  @Put(':id/assignments/:assignmentId')
  @ApiOperation({ summary: 'Update an assignment' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'assignmentId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventAssignmentResponseDto })
  async updateAssignment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: UpdateAssignmentDto,
  ): Promise<PartyEventAssignmentResponseDto> {
    return this.partyEventsService.updateAssignment(userId, eventId, assignmentId, dto);
  }

  @Post(':id/assignments/:assignmentId/claim')
  @ApiOperation({ summary: 'Claim an assignment' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'assignmentId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventAssignmentResponseDto })
  async claimAssignment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ): Promise<PartyEventAssignmentResponseDto> {
    return this.partyEventsService.claimAssignment(userId, eventId, assignmentId);
  }

  @Post(':id/assignments/:assignmentId/complete')
  @ApiOperation({ summary: 'Mark an assignment as complete' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'assignmentId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PartyEventAssignmentResponseDto })
  async completeAssignment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ): Promise<PartyEventAssignmentResponseDto> {
    return this.partyEventsService.completeAssignment(userId, eventId, assignmentId);
  }
}
