import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  GroupQueryDto,
  GroupResponseDto,
  GroupDetailResponseDto,
  PaginatedGroupsDto,
  AddRecipesToGroupDto,
  RemoveRecipesFromGroupDto,
  ReorderRecipesDto,
} from './dto/group.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recipe group/collection' })
  @ApiResponse({ status: 201, type: GroupResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all groups for current user' })
  @ApiResponse({ status: 200, type: PaginatedGroupsDto })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: GroupQueryDto,
  ): Promise<PaginatedGroupsDto> {
    return this.groupsService.findAll(userId, query);
  }

  @Get('shared')
  @ApiOperation({ summary: 'Get groups shared with current user' })
  @ApiResponse({ status: 200, type: PaginatedGroupsDto })
  async findSharedWithMe(
    @CurrentUser('id') userId: string,
    @Query() query: GroupQueryDto,
  ): Promise<PaginatedGroupsDto> {
    return this.groupsService.findSharedWithMe(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group by ID with all recipes' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) groupId: string,
  ): Promise<GroupDetailResponseDto> {
    return this.groupsService.findOne(userId, groupId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a group' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupsService.update(userId, groupId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a group' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Group deleted' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) groupId: string,
  ): Promise<void> {
    return this.groupsService.remove(userId, groupId);
  }

  @Post(':id/recipes')
  @ApiOperation({ summary: 'Add recipes to a group' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupDetailResponseDto })
  async addRecipes(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: AddRecipesToGroupDto,
  ): Promise<GroupDetailResponseDto> {
    return this.groupsService.addRecipes(userId, groupId, dto.recipeIds);
  }

  @Delete(':id/recipes')
  @ApiOperation({ summary: 'Remove recipes from a group' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupDetailResponseDto })
  async removeRecipes(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: RemoveRecipesFromGroupDto,
  ): Promise<GroupDetailResponseDto> {
    return this.groupsService.removeRecipes(userId, groupId, dto.recipeIds);
  }

  @Patch(':id/recipes/reorder')
  @ApiOperation({ summary: 'Reorder recipes in a group' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: GroupDetailResponseDto })
  async reorderRecipes(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) groupId: string,
    @Body() dto: ReorderRecipesDto,
  ): Promise<GroupDetailResponseDto> {
    return this.groupsService.reorderRecipes(userId, groupId, dto.recipes);
  }
}
