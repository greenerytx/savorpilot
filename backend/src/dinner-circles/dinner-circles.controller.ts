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
import { DinnerCirclesService } from './dinner-circles.service';
import {
  CreateDinnerCircleDto,
  UpdateDinnerCircleDto,
  CreateMemberDto,
  UpdateMemberDto,
  DinnerCircleResponseDto,
  MemberResponseDto,
  COMMON_RESTRICTIONS,
  COMMON_ALLERGENS,
  MEMBER_EMOJIS,
} from './dto/dinner-circle.dto';

@ApiTags('Dinner Circles')
@ApiBearerAuth()
@Controller('dinner-circles')
@UseGuards(JwtAuthGuard)
export class DinnerCirclesController {
  constructor(private readonly dinnerCirclesService: DinnerCirclesService) {}

  // ==================== CIRCLES ====================

  @Post()
  @ApiOperation({ summary: 'Create a new dinner circle' })
  @ApiResponse({ status: 201, type: DinnerCircleResponseDto })
  async createCircle(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDinnerCircleDto,
  ): Promise<DinnerCircleResponseDto> {
    return this.dinnerCirclesService.createCircle(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all circles for the current user' })
  @ApiResponse({ status: 200, type: [DinnerCircleResponseDto] })
  async getUserCircles(
    @CurrentUser('id') userId: string,
  ): Promise<DinnerCircleResponseDto[]> {
    return this.dinnerCirclesService.getUserCircles(userId);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get common options for restrictions/allergens/emojis' })
  @ApiResponse({ status: 200 })
  getOptions() {
    return {
      restrictions: COMMON_RESTRICTIONS,
      allergens: COMMON_ALLERGENS,
      emojis: MEMBER_EMOJIS,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific circle' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: DinnerCircleResponseDto })
  async getCircle(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) circleId: string,
  ): Promise<DinnerCircleResponseDto> {
    return this.dinnerCirclesService.getCircle(userId, circleId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a circle' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: DinnerCircleResponseDto })
  async updateCircle(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) circleId: string,
    @Body() dto: UpdateDinnerCircleDto,
  ): Promise<DinnerCircleResponseDto> {
    return this.dinnerCirclesService.updateCircle(userId, circleId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a circle' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteCircle(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) circleId: string,
  ): Promise<void> {
    return this.dinnerCirclesService.deleteCircle(userId, circleId);
  }

  // ==================== MEMBERS ====================

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to a circle' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, type: MemberResponseDto })
  async addMember(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) circleId: string,
    @Body() dto: CreateMemberDto,
  ): Promise<MemberResponseDto> {
    return this.dinnerCirclesService.addMember(userId, circleId, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of a circle' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: [MemberResponseDto] })
  async getCircleMembers(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) circleId: string,
  ): Promise<MemberResponseDto[]> {
    return this.dinnerCirclesService.getCircleMembers(userId, circleId);
  }

  @Put(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a member' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: MemberResponseDto })
  async updateMember(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) circleId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<MemberResponseDto> {
    return this.dinnerCirclesService.updateMember(
      userId,
      circleId,
      memberId,
      dto,
    );
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a circle' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  async removeMember(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) circleId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    return this.dinnerCirclesService.removeMember(userId, circleId, memberId);
  }

  // ==================== DIETARY INFO ====================

  @Get(':id/dietary-info')
  @ApiOperation({ summary: 'Get combined dietary restrictions and allergens for a circle' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200 })
  async getCircleDietaryInfo(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) circleId: string,
  ) {
    return this.dinnerCirclesService.getCircleDietaryInfo(userId, circleId);
  }
}
