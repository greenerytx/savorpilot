import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UrlImportService } from './url-import.service';
import { ImportUrlDto, ImportContentDto } from './dto';

/**
 * URL Import Controller
 *
 * Endpoints:
 * POST /api/url-import/extract - Extract recipe from URL
 * POST /api/url-import/parse-content - Parse pasted content directly
 * GET  /api/url-import/detect-source - Detect source type for URL
 * GET  /api/url-import/known-sites - Get list of known recipe sites
 */
@Controller('url-import')
@UseGuards(JwtAuthGuard)
export class UrlImportController {
  constructor(private readonly urlImportService: UrlImportService) {}

  /**
   * Extract recipe from URL using multi-tier pipeline
   *
   * Tries free extraction methods first (Schema.org, Microdata, Heuristics)
   * before falling back to paid AI extraction.
   *
   * @param dto - Contains url and optional fallbackContent
   * @returns ExtractionResult with recipe data or error
   */
  @Post('extract')
  async extractFromUrl(@Body() dto: ImportUrlDto, @Request() req: any) {
    if (!dto.url) {
      throw new BadRequestException('URL is required');
    }

    // Validate URL format
    try {
      new URL(dto.url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    const result = await this.urlImportService.extractFromUrl(
      dto.url,
      req.user?.id,
    );

    // If extraction failed but fallback content provided, try parsing that
    if (!result.success && dto.fallbackContent) {
      return this.urlImportService.parseContent(
        dto.fallbackContent,
        dto.url,
      );
    }

    return result;
  }

  /**
   * Parse content directly (for manual paste scenarios)
   *
   * Used when URL extraction fails and user pastes content manually,
   * or for direct text input.
   *
   * @param dto - Contains content and optional metadata
   * @returns ExtractionResult with recipe data
   */
  @Post('parse-content')
  async parseContent(@Body() dto: ImportContentDto, @Request() req: any) {
    if (!dto.content) {
      throw new BadRequestException('Content is required');
    }

    if (dto.content.length < 20) {
      throw new BadRequestException('Content too short to extract a recipe');
    }

    if (dto.content.length > 50000) {
      throw new BadRequestException('Content too long (max 50,000 characters)');
    }

    return this.urlImportService.parseContent(
      dto.content,
      dto.sourceUrl,
      dto.sourceAuthor,
      dto.imageUrl,
    );
  }

  /**
   * Detect the source type of a URL
   *
   * Helps frontend show appropriate UI/messaging before extraction.
   *
   * @param url - The URL to analyze
   * @returns Source detection result
   */
  @Get('detect-source')
  detectSource(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    try {
      new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    return this.urlImportService.detectSource(url);
  }

  /**
   * Get list of known recipe sites
   *
   * Returns sites known to have good Schema.org markup.
   * Useful for showing users which sites have high success rates.
   */
  @Get('known-sites')
  getKnownSites() {
    return this.urlImportService.getKnownRecipeSites();
  }
}
