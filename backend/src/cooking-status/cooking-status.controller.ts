import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CookingStatusService } from './cooking-status.service';
import { UpdateCookingStatusDto } from './dto/cooking-status.dto';

@Controller('cooking-status')
@UseGuards(JwtAuthGuard)
export class CookingStatusController {
  constructor(private readonly cookingStatusService: CookingStatusService) {}

  /**
   * Update my cooking status
   */
  @Put()
  async updateStatus(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateCookingStatusDto,
  ) {
    return this.cookingStatusService.updateStatus(
      req.user.id,
      dto.status,
      dto.recipeId,
    );
  }

  /**
   * Get my current cooking status
   */
  @Get('me')
  async getMyStatus(@Request() req: { user: { id: string } }) {
    return this.cookingStatusService.getMyStatus(req.user.id);
  }

  /**
   * Clear my cooking status (set to IDLE)
   */
  @Delete('me')
  async clearStatus(@Request() req: { user: { id: string } }) {
    await this.cookingStatusService.clearStatus(req.user.id);
    return { success: true };
  }

  /**
   * Get friends who are currently cooking
   */
  @Get('friends')
  async getFriendsCooking(@Request() req: { user: { id: string } }) {
    return this.cookingStatusService.getFriendsCooking(req.user.id);
  }

  /**
   * Get cooking activity summary
   */
  @Get('activity-summary')
  async getCookingActivitySummary(@Request() req: { user: { id: string } }) {
    return this.cookingStatusService.getCookingActivitySummary(req.user.id);
  }

  /**
   * Get users currently cooking a specific recipe
   */
  @Get('recipe/:recipeId')
  async getRecipeCookingNow(
    @Request() req: { user: { id: string } },
    @Param('recipeId') recipeId: string,
    @Query('limit') limit?: string,
  ) {
    return this.cookingStatusService.getRecipeCookingNow(
      recipeId,
      req.user.id,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
