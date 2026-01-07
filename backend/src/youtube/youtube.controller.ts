import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { YouTubeService } from './youtube.service';
import {
  SubmitYouTubeDto,
  YouTubeJobStatusDto,
  YouTubeExtractionResultDto,
  ImportYouTubeRecipeDto,
} from './dto';

@ApiTags('youtube')
@ApiBearerAuth()
@Controller('youtube')
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

  /**
   * Submit a YouTube URL for recipe extraction
   */
  @Post('extract')
  @ApiOperation({ summary: 'Submit YouTube URL for recipe extraction' })
  @ApiResponse({
    status: 201,
    description: 'Extraction job created',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid YouTube URL or video too long' })
  async submitUrl(
    @Request() req: any,
    @Body() dto: SubmitYouTubeDto,
  ): Promise<{ jobId: string }> {
    return this.youtubeService.submitUrl(req.user.id, dto.url);
  }

  /**
   * Get extraction job status
   */
  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get extraction job status' })
  @ApiResponse({ status: 200, description: 'Job status', type: YouTubeJobStatusDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<YouTubeJobStatusDto> {
    return this.youtubeService.getJobStatus(req.user.id, id);
  }

  /**
   * Get extraction result with extracted recipe
   */
  @Get('jobs/:id/result')
  @ApiOperation({ summary: 'Get extraction result' })
  @ApiResponse({ status: 200, description: 'Extraction result', type: YouTubeExtractionResultDto })
  @ApiResponse({ status: 400, description: 'Extraction not complete' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getExtractionResult(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<YouTubeExtractionResultDto> {
    return this.youtubeService.getExtractionResult(req.user.id, id);
  }

  /**
   * Import extracted recipe as a saved recipe
   */
  @Post('jobs/:id/import')
  @ApiOperation({ summary: 'Import extracted recipe' })
  @ApiResponse({
    status: 201,
    description: 'Recipe imported',
    schema: {
      type: 'object',
      properties: {
        recipeId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Extraction not complete' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async importRecipe(
    @Request() req: any,
    @Param('id') id: string,
    @Query('recipeIndex', new DefaultValuePipe(0), ParseIntPipe) recipeIndex: number,
    @Body() dto: ImportYouTubeRecipeDto,
  ): Promise<{ recipeId: string }> {
    return this.youtubeService.importRecipe(req.user.id, id, recipeIndex, dto);
  }

  /**
   * Cancel an in-progress extraction job
   */
  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Cancel extraction job' })
  @ApiResponse({ status: 200, description: 'Job cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed/failed job' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async cancelJob(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.youtubeService.cancelJob(req.user.id, id);
  }

  /**
   * Retry a failed extraction job
   */
  @Post('jobs/:id/retry')
  @ApiOperation({ summary: 'Retry failed extraction job' })
  @ApiResponse({
    status: 201,
    description: 'New extraction job created',
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Job is not in failed state' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryJob(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<{ jobId: string }> {
    return this.youtubeService.retryJob(req.user.id, id);
  }

  /**
   * Get user's extraction job history
   */
  @Get('jobs')
  @ApiOperation({ summary: 'Get extraction job history' })
  @ApiResponse({ status: 200, description: 'Job history', type: [YouTubeJobStatusDto] })
  async getJobHistory(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<YouTubeJobStatusDto[]> {
    return this.youtubeService.getJobHistory(req.user.id, Math.min(limit, 50));
  }

  /**
   * Delete a job from extraction history
   */
  @Delete('history/:id')
  @ApiOperation({ summary: 'Delete job from extraction history' })
  @ApiResponse({ status: 200, description: 'Job deleted from history' })
  @ApiResponse({ status: 400, description: 'Cannot delete job that is still processing' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async deleteFromHistory(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.youtubeService.deleteFromHistory(req.user.id, id);
  }
}
