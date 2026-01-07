import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecipeRequestsService } from './recipe-requests.service';
import { CreateRecipeRequestDto } from './dto/recipe-request.dto';
import { RequestStatus } from '@prisma/client';

@Controller('recipe-requests')
@UseGuards(JwtAuthGuard)
export class RecipeRequestsController {
  constructor(private readonly recipeRequestsService: RecipeRequestsService) {}

  /**
   * Create a recipe request
   */
  @Post()
  async createRequest(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateRecipeRequestDto,
  ) {
    return this.recipeRequestsService.createRequest(
      req.user.id,
      dto.targetId,
      dto.recipeId,
      dto.message,
    );
  }

  /**
   * Get incoming requests (requests I've received)
   */
  @Get('incoming')
  async getIncomingRequests(
    @Request() req: { user: { id: string } },
    @Query('status') status?: RequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recipeRequestsService.getIncomingRequests(
      req.user.id,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Get outgoing requests (requests I've made)
   */
  @Get('outgoing')
  async getOutgoingRequests(
    @Request() req: { user: { id: string } },
    @Query('status') status?: RequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recipeRequestsService.getOutgoingRequests(
      req.user.id,
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Get pending request count
   */
  @Get('pending-count')
  async getPendingCount(@Request() req: { user: { id: string } }) {
    const count = await this.recipeRequestsService.getPendingRequestCount(
      req.user.id,
    );
    return { count };
  }

  /**
   * Fulfill a request (share a recipe)
   */
  @Put(':id/fulfill')
  async fulfillRequest(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() body: { recipeId?: string },
  ) {
    return this.recipeRequestsService.fulfillRequest(
      id,
      req.user.id,
      body.recipeId,
    );
  }

  /**
   * Decline a request
   */
  @Put(':id/decline')
  async declineRequest(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.recipeRequestsService.declineRequest(id, req.user.id);
  }

  /**
   * Cancel an outgoing request
   */
  @Delete(':id')
  async cancelRequest(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    await this.recipeRequestsService.cancelRequest(id, req.user.id);
    return { success: true };
  }
}
