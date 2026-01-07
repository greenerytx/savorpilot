import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YouTubeProcessorService } from './youtube-processor.service';
import { YouTubeAiService } from './youtube-ai.service';
import {
  YouTubeJobStatusDto,
  YouTubeExtractionResultDto,
  ImportYouTubeRecipeDto,
} from './dto';
import { JobProgress, VideoMetadata } from './types';
import { YouTubeJobStatus, RecipeSource } from '@prisma/client';

/**
 * Main service for YouTube recipe extraction
 * Orchestrates the extraction pipeline and manages job state
 */
@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly maxDuration: number;

  // In-memory progress tracking for real-time updates
  private readonly jobProgress = new Map<string, JobProgress>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: YouTubeProcessorService,
    private readonly youtubeAi: YouTubeAiService,
  ) {
    this.maxDuration = parseInt(process.env.YOUTUBE_MAX_DURATION || '3600', 10);
  }

  /**
   * Submit a YouTube URL for extraction
   */
  async submitUrl(userId: string, url: string): Promise<{ jobId: string }> {
    // Extract video ID
    const videoId = this.processor.extractVideoId(url);
    if (!videoId) {
      throw new BadRequestException('Invalid YouTube URL');
    }

    // Check for existing job
    const existing = await this.prisma.youTubeExtractionJob.findFirst({
      where: {
        userId,
        videoId,
        status: {
          notIn: ['FAILED'],
        },
      },
    });

    if (existing) {
      if (existing.status === 'COMPLETED') {
        return { jobId: existing.id };
      }
      throw new BadRequestException(
        'This video is already being processed. Check the existing job.',
      );
    }

    // Fetch video metadata
    let metadata: VideoMetadata;
    try {
      metadata = await this.processor.getVideoMetadata(videoId);
    } catch (error) {
      this.logger.error(`Failed to fetch metadata for ${videoId}:`, error);
      throw new BadRequestException(
        'Could not fetch video information. Please check the URL and try again.',
      );
    }

    // Validate duration
    if (metadata.duration > this.maxDuration) {
      const maxMinutes = Math.floor(this.maxDuration / 60);
      throw new BadRequestException(
        `Video exceeds ${maxMinutes} minute limit (${Math.floor(metadata.duration / 60)} minutes)`,
      );
    }

    // Create job record
    const job = await this.prisma.youTubeExtractionJob.create({
      data: {
        userId,
        youtubeUrl: url,
        videoId,
        videoTitle: metadata.title,
        videoDuration: metadata.duration,
        channelName: metadata.channel,
        thumbnailUrl: metadata.thumbnail,
        videoDescription: metadata.description,
        status: 'PENDING',
      },
    });

    this.logger.log(`Created extraction job ${job.id} for video ${videoId}`);

    // Start background processing
    this.processJob(job.id).catch((err) => {
      this.logger.error(`Job ${job.id} failed:`, err);
    });

    return { jobId: job.id };
  }

  /**
   * Get job status
   */
  async getJobStatus(userId: string, jobId: string): Promise<YouTubeJobStatusDto> {
    const job = await this.prisma.youTubeExtractionJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Merge with in-memory progress if available
    const progress = this.jobProgress.get(jobId);

    return {
      id: job.id,
      status: job.status,
      currentStep: progress?.currentStep || job.currentStep,
      progress: progress?.progress || job.progress,
      videoTitle: job.videoTitle,
      channelName: job.channelName,
      thumbnailUrl: job.thumbnailUrl,
      videoDuration: job.videoDuration,
      framesExtracted: progress?.framesExtracted || job.framesExtracted,
      framesWithText: progress?.framesWithText || job.framesWithText,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  }

  /**
   * Get extraction result
   */
  async getExtractionResult(
    userId: string,
    jobId: string,
  ): Promise<YouTubeExtractionResultDto> {
    const job = await this.prisma.youTubeExtractionJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Extraction is not yet complete');
    }

    // Normalize to arrays
    const extractedRecipes = Array.isArray(job.extractedRecipes)
      ? job.extractedRecipes
      : job.extractedRecipes
        ? [job.extractedRecipes]
        : [];

    const importedRecipeIds = Array.isArray(job.importedRecipeIds)
      ? (job.importedRecipeIds as string[])
      : [];

    return {
      id: job.id,
      videoTitle: job.videoTitle,
      channelName: job.channelName,
      thumbnailUrl: job.thumbnailUrl,
      youtubeUrl: job.youtubeUrl,
      transcription: job.transcription,
      extractedRecipes: extractedRecipes as any,
      importedRecipeIds,
    };
  }

  /**
   * Import extracted recipe as a Recipe
   */
  async importRecipe(
    userId: string,
    jobId: string,
    recipeIndex: number,
    dto: ImportYouTubeRecipeDto,
  ): Promise<{ recipeId: string }> {
    const job = await this.prisma.youTubeExtractionJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Extraction is not yet complete');
    }

    // Check if this specific recipe was already imported
    const importedRecipeIds = Array.isArray(job.importedRecipeIds)
      ? (job.importedRecipeIds as string[])
      : [];

    const existingId = importedRecipeIds[recipeIndex];
    if (existingId) {
      return { recipeId: existingId };
    }

    // Create recipe
    const recipe = await this.prisma.recipe.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        prepTimeMinutes: dto.prepTimeMinutes,
        cookTimeMinutes: dto.cookTimeMinutes,
        totalTimeMinutes:
          (dto.prepTimeMinutes || 0) + (dto.cookTimeMinutes || 0) || null,
        servings: dto.servings || 4,
        difficulty: dto.difficulty as any,
        category: dto.category as any,
        cuisine: dto.cuisine,
        tags: dto.tags || [],
        components: dto.components as any,
        source: RecipeSource.YOUTUBE,
        sourceUrl: job.youtubeUrl,
        sourceAuthor: job.channelName,
        imageUrl: job.thumbnailUrl,
      },
    });

    // Update job with imported recipe ID at the specific index
    const newImportedIds = [...importedRecipeIds];
    newImportedIds[recipeIndex] = recipe.id;

    await this.prisma.youTubeExtractionJob.update({
      where: { id: jobId },
      data: { importedRecipeIds: newImportedIds },
    });

    this.logger.log(`Imported recipe ${recipe.id} from job ${jobId} (index ${recipeIndex})`);

    return { recipeId: recipe.id };
  }

  /**
   * Cancel a job
   */
  async cancelJob(userId: string, jobId: string): Promise<void> {
    const job = await this.prisma.youTubeExtractionJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (['COMPLETED', 'FAILED'].includes(job.status)) {
      throw new BadRequestException('Cannot cancel a completed or failed job');
    }

    await this.prisma.youTubeExtractionJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMessage: 'Cancelled by user',
        completedAt: new Date(),
      },
    });

    // Cleanup temp files
    const jobDir = await this.processor.createJobDir(jobId);
    await this.processor.cleanup(jobDir);

    this.jobProgress.delete(jobId);

    this.logger.log(`Cancelled job ${jobId}`);
  }

  /**
   * Retry a failed extraction job
   */
  async retryJob(userId: string, jobId: string): Promise<{ jobId: string }> {
    const job = await this.prisma.youTubeExtractionJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'FAILED') {
      throw new BadRequestException('Can only retry failed jobs');
    }

    // Create a new job with the same URL
    return this.submitUrl(userId, job.youtubeUrl);
  }

  /**
   * Get user's job history
   */
  async getJobHistory(
    userId: string,
    limit: number = 10,
  ): Promise<YouTubeJobStatusDto[]> {
    const jobs = await this.prisma.youTubeExtractionJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return jobs.map((job) => ({
      id: job.id,
      status: job.status,
      currentStep: job.currentStep,
      progress: job.progress,
      videoTitle: job.videoTitle,
      channelName: job.channelName,
      thumbnailUrl: job.thumbnailUrl,
      videoDuration: job.videoDuration,
      framesExtracted: job.framesExtracted,
      framesWithText: job.framesWithText,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    }));
  }

  /**
   * Delete a job from extraction history
   */
  async deleteFromHistory(userId: string, jobId: string): Promise<void> {
    const job = await this.prisma.youTubeExtractionJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Don't allow deleting jobs that are still processing
    if (!['COMPLETED', 'FAILED'].includes(job.status)) {
      throw new BadRequestException(
        'Cannot delete a job that is still processing. Cancel it first.',
      );
    }

    await this.prisma.youTubeExtractionJob.delete({
      where: { id: jobId },
    });

    this.logger.log(`Deleted extraction job ${jobId} from history`);
  }

  /**
   * Process extraction job (runs in background)
   */
  private async processJob(jobId: string): Promise<void> {
    let jobDir: string | null = null;

    try {
      // Initialize progress
      this.jobProgress.set(jobId, {
        status: 'DOWNLOADING',
        currentStep: 'Downloading video...',
        progress: 0,
        framesExtracted: 0,
        framesWithText: 0,
      });

      // Get job
      const job = await this.prisma.youTubeExtractionJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Update status to downloading
      await this.updateJobStatus(jobId, 'DOWNLOADING', 'Downloading video...', 5);

      // Create temp directory
      await this.processor.ensureTempDir();
      jobDir = await this.processor.createJobDir(jobId);

      // Step 1: Download video and extract audio
      const { videoPath, audioPath } = await this.processor.downloadAndExtractAudio(
        job.videoId,
        jobDir,
        (percent) => {
          this.updateProgress(jobId, 'Downloading video...', Math.min(percent * 0.2, 20));
        },
      );

      // Step 2: Extract audio
      await this.updateJobStatus(jobId, 'EXTRACTING_AUDIO', 'Extracting audio...', 25);

      // Step 3: Transcribe audio
      await this.updateJobStatus(jobId, 'TRANSCRIBING', 'Transcribing audio...', 30);
      const transcription = await this.youtubeAi.transcribeAudio(audioPath);

      // Save transcription
      await this.prisma.youTubeExtractionJob.update({
        where: { id: jobId },
        data: { transcription },
      });

      // Step 4: Extract frames with scene detection
      await this.updateJobStatus(jobId, 'EXTRACTING_FRAMES', 'Extracting frames...', 45);
      const framesDir = `${jobDir}/frames`;
      const framePaths = await this.processor.extractFrames(
        videoPath,
        framesDir,
        (extracted) => {
          this.updateProgress(jobId, 'Extracting frames...', 45 + Math.min(extracted * 0.1, 10), extracted);
        },
      );

      // Update frames extracted count
      await this.prisma.youTubeExtractionJob.update({
        where: { id: jobId },
        data: { framesExtracted: framePaths.length },
      });

      // Step 5: OCR pre-filter frames
      await this.updateJobStatus(jobId, 'OCR_PROCESSING', 'Analyzing frames for text...', 55);
      const framesWithText = await this.processor.ocrFilterFrames(
        framePaths,
        (processed, withText) => {
          this.updateProgress(
            jobId,
            `Analyzing frames... (${withText} with text)`,
            55 + (processed / framePaths.length) * 15,
            framePaths.length,
            withText,
          );
        },
      );

      // Update frames with text count
      await this.prisma.youTubeExtractionJob.update({
        where: { id: jobId },
        data: {
          framesWithText: framesWithText.length,
          ocrResults: framesWithText.map(f => ({ timestamp: f.timestamp, text: f.ocrText })),
        },
      });

      // Step 6: AI Synthesis
      await this.updateJobStatus(jobId, 'AI_SYNTHESIS', 'Analyzing content with AI...', 70);

      // Analyze frames with Vision API
      const frameAnalyses = await this.youtubeAi.analyzeFramesWithVision(framesWithText);

      this.updateProgress(jobId, 'Synthesizing recipe...', 85);

      // Synthesize recipe from transcription and frame analyses
      const videoMetadata = {
        title: job.videoTitle || 'Unknown',
        duration: job.videoDuration || 0,
        channel: job.channelName || 'Unknown',
        thumbnail: job.thumbnailUrl || '',
        description: job.videoDescription || '',
      };

      const extractedRecipes = await this.youtubeAi.synthesizeRecipes(
        transcription,
        frameAnalyses,
        videoMetadata,
      );

      // Step 7: Complete
      await this.prisma.youTubeExtractionJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          currentStep: 'Complete',
          progress: 100,
          extractedRecipes: extractedRecipes as any,
          importedRecipeIds: [],
          completedAt: new Date(),
        },
      });

      this.jobProgress.delete(jobId);

      this.logger.log(`Job ${jobId} completed successfully`);

    } catch (error) {
      this.logger.error(`Job ${jobId} failed:`, error);

      await this.prisma.youTubeExtractionJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      this.jobProgress.delete(jobId);

    } finally {
      // Cleanup temp files
      if (jobDir) {
        await this.processor.cleanup(jobDir);
      }
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    jobId: string,
    status: YouTubeJobStatus,
    currentStep: string,
    progress: number,
  ): Promise<void> {
    await this.prisma.youTubeExtractionJob.update({
      where: { id: jobId },
      data: {
        status,
        currentStep,
        progress,
        startedAt: status !== 'PENDING' ? new Date() : undefined,
      },
    });

    this.updateProgress(jobId, currentStep, progress);
  }

  /**
   * Update in-memory progress for real-time updates
   */
  private updateProgress(
    jobId: string,
    currentStep: string,
    progress: number,
    framesExtracted?: number,
    framesWithText?: number,
  ): void {
    const current = this.jobProgress.get(jobId) || {
      status: 'PENDING',
      currentStep: '',
      progress: 0,
      framesExtracted: 0,
      framesWithText: 0,
    };

    this.jobProgress.set(jobId, {
      ...current,
      currentStep,
      progress: Math.round(progress),
      framesExtracted: framesExtracted ?? current.framesExtracted,
      framesWithText: framesWithText ?? current.framesWithText,
    });
  }
}
