import { api } from './api';

/**
 * URL Source types matching backend UrlSource enum
 */
export enum UrlSource {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  RECIPE_SITE = 'RECIPE_SITE',
  GENERIC_WEBSITE = 'GENERIC_WEBSITE',
  PDF = 'PDF',
}

/**
 * Extraction method used
 */
export enum ExtractionMethod {
  SCHEMA_ORG = 'SCHEMA_ORG',
  MICRODATA = 'MICRODATA',
  HEURISTICS = 'HEURISTICS',
  AI = 'AI',
  MANUAL = 'MANUAL',
}

/**
 * Source detection result
 */
export interface SourceDetectionResult {
  source: UrlSource;
  isKnownRecipeSite: boolean;
  siteName?: string;
}

/**
 * Recipe extraction result
 */
export interface ExtractionResult {
  success: boolean;
  recipe?: ParsedRecipeDto;
  extractionMethod: ExtractionMethod;
  confidence: number;
  aiTokensUsed?: number;
  processingTimeMs?: number;
  error?: string;
  requiresManualInput?: boolean;
  partialData?: Partial<ParsedRecipeDto>;
}

/**
 * Parsed recipe DTO (matches backend)
 */
export interface ParsedRecipeDto {
  title: string;
  description?: string;
  imageUrl?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty?: string;
  category?: string;
  cuisine?: string;
  tags?: string[];
  components: {
    name: string;
    ingredients: {
      quantity?: number;
      unit?: string;
      name: string;
      notes?: string;
      optional?: boolean;
    }[];
    steps: {
      order: number;
      instruction: string;
      duration?: number;
      tips?: string;
    }[];
  }[];
  confidence?: number;
  sourceUrl?: string;
  sourceAuthor?: string;
  videoUrl?: string;
}

/**
 * Known recipe site info
 */
export interface KnownRecipeSite {
  domain: string;
  name: string;
}

/**
 * URL Import Service
 *
 * Provides client-side access to the multi-tier extraction pipeline.
 * Uses free extraction methods (Schema.org, Microdata, Heuristics) before AI.
 */
export const urlImportService = {
  /**
   * Extract recipe from URL using multi-tier pipeline
   *
   * @param url - The URL to extract from
   * @param fallbackContent - Optional content to parse if URL extraction fails
   */
  async extractFromUrl(url: string, fallbackContent?: string): Promise<ExtractionResult> {
    const response = await api.post<ExtractionResult>('/url-import/extract', {
      url,
      fallbackContent,
    });
    return response.data;
  },

  /**
   * Parse content directly (for manual paste scenarios)
   *
   * @param content - The text content to parse
   * @param sourceUrl - Optional URL for attribution
   * @param sourceAuthor - Optional author for attribution
   * @param imageUrl - Optional image URL
   */
  async parseContent(
    content: string,
    sourceUrl?: string,
    sourceAuthor?: string,
    imageUrl?: string,
  ): Promise<ExtractionResult> {
    const response = await api.post<ExtractionResult>('/url-import/parse-content', {
      content,
      sourceUrl,
      sourceAuthor,
      imageUrl,
    });
    return response.data;
  },

  /**
   * Detect the source type of a URL without extracting
   *
   * @param url - The URL to analyze
   */
  async detectSource(url: string): Promise<SourceDetectionResult> {
    const response = await api.get<SourceDetectionResult>('/url-import/detect-source', {
      params: { url },
    });
    return response.data;
  },

  /**
   * Get list of known recipe sites with high extraction success rates
   */
  async getKnownSites(): Promise<KnownRecipeSite[]> {
    const response = await api.get<KnownRecipeSite[]>('/url-import/known-sites');
    return response.data;
  },

  /**
   * Client-side URL source detection (fast, no API call)
   * Used for real-time UI feedback as user types
   */
  detectSourceLocal(url: string): SourceDetectionResult | null {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase().replace('www.', '');

      // Instagram
      if (hostname.includes('instagram.com') || hostname === 'instagr.am') {
        return { source: UrlSource.INSTAGRAM, isKnownRecipeSite: false };
      }

      // Facebook
      if (
        hostname.includes('facebook.com') ||
        hostname.includes('fb.com') ||
        hostname.includes('fb.watch')
      ) {
        return { source: UrlSource.FACEBOOK, isKnownRecipeSite: false };
      }

      // YouTube
      if (
        hostname.includes('youtube.com') ||
        hostname.includes('youtu.be')
      ) {
        return { source: UrlSource.YOUTUBE, isKnownRecipeSite: false };
      }

      // TikTok
      if (hostname.includes('tiktok.com')) {
        return { source: UrlSource.TIKTOK, isKnownRecipeSite: false };
      }

      // PDF
      if (parsedUrl.pathname.toLowerCase().endsWith('.pdf')) {
        return { source: UrlSource.PDF, isKnownRecipeSite: false };
      }

      // Known recipe sites (common ones for quick detection)
      const knownSites: Record<string, string> = {
        'allrecipes.com': 'AllRecipes',
        'foodnetwork.com': 'Food Network',
        'epicurious.com': 'Epicurious',
        'seriouseats.com': 'Serious Eats',
        'bonappetit.com': 'Bon Appétit',
        'delish.com': 'Delish',
        'tasty.co': 'Tasty',
        'simplyrecipes.com': 'Simply Recipes',
        'food52.com': 'Food52',
        'cooking.nytimes.com': 'NYT Cooking',
        'thekitchn.com': 'The Kitchn',
        'budgetbytes.com': 'Budget Bytes',
        'pinchofyum.com': 'Pinch of Yum',
        'halfbakedharvest.com': 'Half Baked Harvest',
        'smittenkitchen.com': 'Smitten Kitchen',
        'kingarthurbaking.com': 'King Arthur Baking',
        'marthastewart.com': 'Martha Stewart',
        'bettycrocker.com': 'Betty Crocker',
        'tasteofhome.com': 'Taste of Home',
        'recipetineats.com': 'RecipeTin Eats',
      };

      for (const [domain, name] of Object.entries(knownSites)) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          return {
            source: UrlSource.RECIPE_SITE,
            isKnownRecipeSite: true,
            siteName: name,
          };
        }
      }

      // Generic website
      return { source: UrlSource.GENERIC_WEBSITE, isKnownRecipeSite: false };
    } catch {
      // Invalid URL
      return null;
    }
  },
};

/**
 * Get user-friendly source label
 */
export function getSourceLabel(source: UrlSource): string {
  switch (source) {
    case UrlSource.INSTAGRAM:
      return 'Instagram';
    case UrlSource.FACEBOOK:
      return 'Facebook';
    case UrlSource.YOUTUBE:
      return 'YouTube';
    case UrlSource.TIKTOK:
      return 'TikTok';
    case UrlSource.RECIPE_SITE:
      return 'Recipe Site';
    case UrlSource.GENERIC_WEBSITE:
      return 'Website';
    case UrlSource.PDF:
      return 'PDF';
    default:
      return 'Unknown';
  }
}

/**
 * Get user-friendly extraction method label
 */
export function getExtractionMethodLabel(method: ExtractionMethod): string {
  switch (method) {
    case ExtractionMethod.SCHEMA_ORG:
      return 'Schema.org';
    case ExtractionMethod.MICRODATA:
      return 'Microdata';
    case ExtractionMethod.HEURISTICS:
      return 'HTML Pattern';
    case ExtractionMethod.AI:
      return 'AI';
    case ExtractionMethod.MANUAL:
      return 'Manual';
    default:
      return 'Unknown';
  }
}
