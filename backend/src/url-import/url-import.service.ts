import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SourceDetectorService } from './source-detector.service';
import { SchemaOrgExtractor } from './extractors/schema-org.extractor';
import { MicrodataExtractor } from './extractors/microdata.extractor';
import { HeuristicsExtractor } from './extractors/heuristics.extractor';
import {
  ExtractionResult,
  ExtractionMethod,
  UrlSource,
  SourceDetectionResult,
} from './dto';
import { ParsedRecipeDto } from '../ai/dto/parse-recipe.dto';

/**
 * URL Import Service - Main Orchestrator
 *
 * Implements a multi-tier extraction pipeline to maximize cost savings:
 * Tier 1: Schema.org/JSON-LD (FREE) - ~60% success rate
 * Tier 2: Microdata/RDFa (FREE) - ~10% additional
 * Tier 3: HTML Heuristics (FREE) - ~15% additional
 * Tier 4: AI Parse (PAID) - ~15% fallback
 *
 * Expected cost savings: ~85% reduction in AI usage
 */
@Injectable()
export class UrlImportService {
  private readonly logger = new Logger(UrlImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly sourceDetector: SourceDetectorService,
    private readonly schemaOrgExtractor: SchemaOrgExtractor,
    private readonly microdataExtractor: MicrodataExtractor,
    private readonly heuristicsExtractor: HeuristicsExtractor,
  ) {}

  /**
   * Extract recipe from URL using multi-tier pipeline
   */
  async extractFromUrl(url: string, userId?: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    this.logger.log(`Starting extraction for URL: ${url}`);

    // Detect source type
    const sourceInfo = this.sourceDetector.detectSource(url);
    this.logger.log(
      `Source detected: ${sourceInfo.source}${sourceInfo.siteName ? ` (${sourceInfo.siteName})` : ''}`,
    );

    let result: ExtractionResult;

    try {
      // Route to appropriate handler based on source type
      switch (sourceInfo.source) {
        case UrlSource.INSTAGRAM:
          result = await this.extractFromInstagram(url);
          break;

        case UrlSource.YOUTUBE:
          result = await this.extractFromYouTube(url);
          break;

        case UrlSource.FACEBOOK:
          result = await this.extractFromFacebook(url);
          break;

        case UrlSource.TIKTOK:
          result = await this.extractFromTikTok(url);
          break;

        case UrlSource.PDF:
          result = await this.extractFromPdf(url);
          break;

        case UrlSource.RECIPE_SITE:
        case UrlSource.GENERIC_WEBSITE:
        default:
          result = await this.extractFromWebsite(url, sourceInfo);
          break;
      }
    } catch (error) {
      this.logger.error(`Extraction failed for ${url}:`, error);
      result = {
        success: false,
        extractionMethod: ExtractionMethod.AI,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown extraction error',
        requiresManualInput: true,
      };
    }

    // Calculate total processing time
    result.processingTimeMs = Date.now() - startTime;

    // Log import attempt for analytics
    if (userId) {
      await this.logImportAttempt(userId, url, sourceInfo, result);
    }

    return result;
  }

  /**
   * Extract recipe from website using tiered approach
   */
  private async extractFromWebsite(
    url: string,
    sourceInfo: SourceDetectionResult,
  ): Promise<ExtractionResult> {
    // Fetch the page content
    const html = await this.fetchPageContent(url);

    // Track best partial result for fallback
    let bestPartialResult: ExtractionResult | null = null;

    // Tier 1: Try Schema.org/JSON-LD (FREE)
    if (this.schemaOrgExtractor.canHandle(html)) {
      this.logger.log('Attempting Schema.org extraction (Tier 1)...');
      const schemaResult = await this.schemaOrgExtractor.extract(html, url);

      if (schemaResult.success && schemaResult.confidence >= 0.6) {
        this.logger.log(
          `Schema.org extraction successful (confidence: ${schemaResult.confidence.toFixed(2)})`,
        );
        return schemaResult;
      } else if (schemaResult.partialData) {
        this.logger.log('Schema.org extraction partial, continuing to next tier...');
        bestPartialResult = schemaResult;
      }
    }

    // Tier 2: Try Microdata/RDFa (FREE)
    if (this.microdataExtractor.canHandle(html)) {
      this.logger.log('Attempting Microdata extraction (Tier 2)...');
      const microdataResult = await this.microdataExtractor.extract(html, url);

      if (microdataResult.success && microdataResult.confidence >= 0.6) {
        this.logger.log(
          `Microdata extraction successful (confidence: ${microdataResult.confidence.toFixed(2)})`,
        );
        return microdataResult;
      } else if (microdataResult.partialData &&
                 (!bestPartialResult || microdataResult.confidence > bestPartialResult.confidence)) {
        bestPartialResult = microdataResult;
      }
    }

    // Tier 3: Try HTML Heuristics (FREE)
    if (this.heuristicsExtractor.canHandle(html)) {
      this.logger.log('Attempting Heuristics extraction (Tier 3)...');
      const heuristicsResult = await this.heuristicsExtractor.extract(html, url);

      if (heuristicsResult.success && heuristicsResult.confidence >= 0.5) {
        this.logger.log(
          `Heuristics extraction successful (confidence: ${heuristicsResult.confidence.toFixed(2)})`,
        );
        return heuristicsResult;
      } else if (heuristicsResult.partialData &&
                 (!bestPartialResult || heuristicsResult.confidence > bestPartialResult.confidence)) {
        bestPartialResult = heuristicsResult;
      }
    }

    // If we have a partial result with reasonable confidence, use it
    if (bestPartialResult && bestPartialResult.confidence >= 0.4) {
      this.logger.log(
        `Using best partial result (confidence: ${bestPartialResult.confidence.toFixed(2)})`,
      );
      return bestPartialResult;
    }

    // Tier 4: Fall back to AI parsing (PAID)
    this.logger.log('Falling back to AI extraction (Tier 4)...');
    return this.extractWithAi(url, html);
  }

  /**
   * Extract from Instagram URL
   */
  private async extractFromInstagram(url: string): Promise<ExtractionResult> {
    this.logger.log('Extracting from Instagram...');

    try {
      const recipe = await this.aiService.parseRecipeFromUrl(url);

      return {
        success: true,
        recipe,
        extractionMethod: ExtractionMethod.AI,
        confidence: recipe.confidence || 0.8,
        aiTokensUsed: this.estimateTokenUsage(recipe),
      };
    } catch (error) {
      return {
        success: false,
        extractionMethod: ExtractionMethod.AI,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Instagram extraction failed',
        requiresManualInput: true,
      };
    }
  }

  /**
   * Extract from YouTube URL
   */
  private async extractFromYouTube(url: string): Promise<ExtractionResult> {
    this.logger.log('Extracting from YouTube...');

    // YouTube extraction is handled by yt-dlp in a separate service
    // For now, fall back to AI parsing of the video description
    try {
      const recipe = await this.aiService.parseRecipeFromUrl(url);

      return {
        success: true,
        recipe,
        extractionMethod: ExtractionMethod.AI,
        confidence: recipe.confidence || 0.7,
        aiTokensUsed: this.estimateTokenUsage(recipe),
      };
    } catch (error) {
      return {
        success: false,
        extractionMethod: ExtractionMethod.AI,
        confidence: 0,
        error: error instanceof Error ? error.message : 'YouTube extraction failed',
        requiresManualInput: true,
      };
    }
  }

  /**
   * Extract from Facebook URL
   */
  private async extractFromFacebook(url: string): Promise<ExtractionResult> {
    this.logger.log('Extracting from Facebook...');

    // Try mobile version first (simpler HTML)
    const mobileUrl = url.replace('www.facebook.com', 'm.facebook.com');

    try {
      // Attempt to fetch mobile version
      const html = await this.fetchPageContent(mobileUrl, {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      });

      // Extract og:description meta tag
      const descMatch =
        html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i) ||
        html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/i);

      if (descMatch) {
        const caption = this.decodeHtmlEntities(descMatch[1]);
        this.logger.log(`Extracted Facebook caption (${caption.length} chars)`);

        // Parse with AI
        const recipe = await this.aiService.parseRecipeFromText(caption);
        recipe.sourceUrl = url;

        // Try to get author
        const authorMatch =
          html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
          html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
        if (authorMatch) {
          recipe.sourceAuthor = this.decodeHtmlEntities(authorMatch[1]);
        }

        // Try to get image
        const imageMatch =
          html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
          html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
        if (imageMatch) {
          recipe.imageUrl = this.decodeHtmlEntities(imageMatch[1]);
        }

        return {
          success: true,
          recipe,
          extractionMethod: ExtractionMethod.AI,
          confidence: recipe.confidence || 0.7,
          aiTokensUsed: this.estimateTokenUsage(recipe),
        };
      }
    } catch {
      this.logger.warn('Facebook mobile fetch failed, trying oEmbed...');
    }

    // Try oEmbed API
    try {
      const oEmbedUrl = `https://www.facebook.com/plugins/post/oembed.json/?url=${encodeURIComponent(url)}`;
      const oEmbedResponse = await fetch(oEmbedUrl);

      if (oEmbedResponse.ok) {
        const oEmbed = await oEmbedResponse.json();
        if (oEmbed.html) {
          // Extract text content from HTML
          const textContent = oEmbed.html
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const recipe = await this.aiService.parseRecipeFromText(textContent);
          recipe.sourceUrl = url;
          recipe.sourceAuthor = oEmbed.author_name;

          return {
            success: true,
            recipe,
            extractionMethod: ExtractionMethod.AI,
            confidence: recipe.confidence || 0.6,
            aiTokensUsed: this.estimateTokenUsage(recipe),
          };
        }
      }
    } catch {
      this.logger.warn('Facebook oEmbed failed');
    }

    // Facebook extraction failed - require manual input
    return {
      success: false,
      extractionMethod: ExtractionMethod.MANUAL,
      confidence: 0,
      error:
        'Could not extract content from Facebook. The post may be private or require login.',
      requiresManualInput: true,
    };
  }

  /**
   * Extract from TikTok URL
   */
  private async extractFromTikTok(url: string): Promise<ExtractionResult> {
    this.logger.log('Extracting from TikTok...');

    // TikTok is similar to Instagram - try oEmbed first
    try {
      const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const oEmbedResponse = await fetch(oEmbedUrl);

      if (oEmbedResponse.ok) {
        const oEmbed = await oEmbedResponse.json();

        if (oEmbed.title) {
          // TikTok titles are often the full caption
          const recipe = await this.aiService.parseRecipeFromText(oEmbed.title);
          recipe.sourceUrl = url;
          recipe.sourceAuthor = oEmbed.author_name;
          recipe.imageUrl = oEmbed.thumbnail_url;

          return {
            success: true,
            recipe,
            extractionMethod: ExtractionMethod.AI,
            confidence: recipe.confidence || 0.6,
            aiTokensUsed: this.estimateTokenUsage(recipe),
          };
        }
      }
    } catch {
      this.logger.warn('TikTok oEmbed failed');
    }

    return {
      success: false,
      extractionMethod: ExtractionMethod.MANUAL,
      confidence: 0,
      error: 'Could not extract content from TikTok.',
      requiresManualInput: true,
    };
  }

  /**
   * Extract from PDF URL
   */
  private async extractFromPdf(url: string): Promise<ExtractionResult> {
    this.logger.log('Extracting from PDF...');

    // PDF extraction requires specialized handling
    // For now, mark as requiring manual input
    return {
      success: false,
      extractionMethod: ExtractionMethod.MANUAL,
      confidence: 0,
      error: 'PDF extraction not yet implemented. Please copy and paste the recipe text.',
      requiresManualInput: true,
    };
  }

  /**
   * Extract recipe using AI (Tier 4 - PAID)
   */
  private async extractWithAi(url: string, html: string): Promise<ExtractionResult> {
    try {
      const recipe = await this.aiService.parseRecipeFromUrl(url);

      return {
        success: true,
        recipe,
        extractionMethod: ExtractionMethod.AI,
        confidence: recipe.confidence || 0.8,
        aiTokensUsed: this.estimateTokenUsage(recipe),
      };
    } catch (error) {
      return {
        success: false,
        extractionMethod: ExtractionMethod.AI,
        confidence: 0,
        error: error instanceof Error ? error.message : 'AI extraction failed',
        requiresManualInput: true,
      };
    }
  }

  /**
   * Parse content directly (for manual paste)
   */
  async parseContent(
    content: string,
    sourceUrl?: string,
    sourceAuthor?: string,
    imageUrl?: string,
  ): Promise<ExtractionResult> {
    this.logger.log(`Parsing content directly (${content.length} chars)`);

    try {
      const recipe = await this.aiService.parseRecipeFromText(content);

      if (sourceUrl) recipe.sourceUrl = sourceUrl;
      if (sourceAuthor) recipe.sourceAuthor = sourceAuthor;
      if (imageUrl) recipe.imageUrl = imageUrl;

      return {
        success: true,
        recipe,
        extractionMethod: ExtractionMethod.AI,
        confidence: recipe.confidence || 0.8,
        aiTokensUsed: this.estimateTokenUsage(recipe),
      };
    } catch (error) {
      return {
        success: false,
        extractionMethod: ExtractionMethod.AI,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Content parsing failed',
        requiresManualInput: true,
      };
    }
  }

  /**
   * Detect source type for a URL
   */
  detectSource(url: string): SourceDetectionResult {
    return this.sourceDetector.detectSource(url);
  }

  /**
   * Get list of known recipe sites
   */
  getKnownRecipeSites(): Array<{ domain: string; name: string }> {
    return this.sourceDetector.getKnownRecipeSites();
  }

  /**
   * Fetch page content with appropriate headers
   */
  private async fetchPageContent(
    url: string,
    headers: Record<string, string> = {},
  ): Promise<string> {
    const defaultHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...headers,
    };

    const response = await fetch(url, {
      headers: defaultHeaders,
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Estimate token usage for analytics
   */
  private estimateTokenUsage(recipe: ParsedRecipeDto): number {
    // Rough estimate: ~4 chars per token
    const recipeText = JSON.stringify(recipe);
    return Math.ceil(recipeText.length / 4);
  }

  /**
   * Log import attempt for analytics
   */
  private async logImportAttempt(
    userId: string,
    url: string,
    sourceInfo: SourceDetectionResult,
    result: ExtractionResult,
  ): Promise<void> {
    try {
      await this.prisma.recipeImportLog.create({
        data: {
          userId,
          sourceUrl: url,
          sourceType: this.mapSourceToRecipeSource(sourceInfo.source),
          extractionMethod: result.extractionMethod,
          confidence: result.confidence,
          aiTokensUsed: result.aiTokensUsed,
          processingTimeMs: result.processingTimeMs,
          success: result.success,
          errorMessage: result.error,
          metadata: {
            siteName: sourceInfo.siteName,
            isKnownRecipeSite: sourceInfo.isKnownRecipeSite,
          },
        },
      });
    } catch (error) {
      // Don't fail the request if logging fails
      this.logger.warn('Failed to log import attempt', error);
    }
  }

  /**
   * Map UrlSource to RecipeSource enum
   */
  private mapSourceToRecipeSource(source: UrlSource): any {
    const mapping: Record<UrlSource, string> = {
      [UrlSource.INSTAGRAM]: 'INSTAGRAM_URL',
      [UrlSource.FACEBOOK]: 'FACEBOOK_URL',
      [UrlSource.YOUTUBE]: 'YOUTUBE',
      [UrlSource.TIKTOK]: 'OTHER',
      [UrlSource.RECIPE_SITE]: 'WEB_URL',
      [UrlSource.GENERIC_WEBSITE]: 'WEB_URL',
      [UrlSource.PDF]: 'PDF',
    };
    return mapping[source] || 'OTHER';
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2019;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#x3A;/g, ':')
      .replace(/&#x3D;/g, '=')
      .replace(
        /&#x([0-9a-fA-F]+);/g,
        (_, hex) => String.fromCharCode(parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  }
}
