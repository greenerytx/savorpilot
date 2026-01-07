import { ParsedRecipeDto } from '../../ai/dto/parse-recipe.dto';
import { ExtractionMethod, ExtractionResult } from '../dto';

/**
 * Base abstract class for all recipe extractors.
 * Each extractor implements a specific extraction method (Schema.org, Microdata, Heuristics, etc.)
 */
export abstract class BaseExtractor {
  /**
   * The extraction method this extractor uses
   */
  abstract readonly method: ExtractionMethod;

  /**
   * Human-readable name for logging/debugging
   */
  abstract readonly name: string;

  /**
   * Priority order (lower = tried first). Used for ordering extractors.
   * Tier 1: 10-19 (Schema.org)
   * Tier 2: 20-29 (Microdata)
   * Tier 3: 30-39 (Heuristics)
   * Tier 4: 40-49 (AI)
   */
  abstract readonly priority: number;

  /**
   * Attempt to extract a recipe from the given HTML content
   * @param html - The HTML content of the page
   * @param url - The original URL (for context/logging)
   * @returns ExtractionResult with recipe data or null if extraction failed
   */
  abstract extract(html: string, url: string): Promise<ExtractionResult>;

  /**
   * Check if this extractor can potentially handle the given HTML
   * This is a quick check before attempting full extraction
   */
  abstract canHandle(html: string): boolean;

  /**
   * Helper to create a successful extraction result
   */
  protected success(
    recipe: ParsedRecipeDto,
    confidence: number,
    processingTimeMs?: number,
  ): ExtractionResult {
    return {
      success: true,
      recipe,
      extractionMethod: this.method,
      confidence: Math.min(1, Math.max(0, confidence)),
      processingTimeMs,
    };
  }

  /**
   * Helper to create a failed extraction result
   */
  protected failure(
    error: string,
    partialData?: Partial<ParsedRecipeDto>,
  ): ExtractionResult {
    return {
      success: false,
      extractionMethod: this.method,
      confidence: 0,
      error,
      partialData,
    };
  }

  /**
   * Helper to normalize whitespace in extracted text
   */
  protected normalizeText(text: string | null | undefined): string {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  /**
   * Helper to parse duration strings (PT1H30M, etc.)
   */
  protected parseDuration(duration: string | null | undefined): number | null {
    if (!duration) return null;

    // Handle ISO 8601 duration format (PT1H30M)
    const isoMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
    if (isoMatch) {
      const hours = parseInt(isoMatch[1] || '0', 10);
      const minutes = parseInt(isoMatch[2] || '0', 10);
      const seconds = parseInt(isoMatch[3] || '0', 10);
      return hours * 60 + minutes + Math.round(seconds / 60);
    }

    // Handle plain number (assume minutes)
    const plainNumber = parseInt(duration, 10);
    if (!isNaN(plainNumber)) {
      return plainNumber;
    }

    // Handle text format (1 hour 30 minutes)
    let totalMinutes = 0;
    const hourMatch = duration.match(/(\d+)\s*(?:hour|hr|h)/i);
    const minuteMatch = duration.match(/(\d+)\s*(?:minute|min|m)/i);

    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1], 10) * 60;
    }
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1], 10);
    }

    return totalMinutes > 0 ? totalMinutes : null;
  }

  /**
   * Helper to extract yield/servings from various formats
   */
  protected parseServings(yield_: string | number | null | undefined): number | null {
    if (yield_ === null || yield_ === undefined) return null;

    if (typeof yield_ === 'number') {
      return yield_;
    }

    // Extract first number from string
    const match = yield_.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
}
