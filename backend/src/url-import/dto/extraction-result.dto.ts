import { ParsedRecipeDto } from '../../ai/dto/parse-recipe.dto';

export enum UrlSource {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  RECIPE_SITE = 'RECIPE_SITE',
  GENERIC_WEBSITE = 'GENERIC_WEBSITE',
  PDF = 'PDF',
}

export enum ExtractionMethod {
  SCHEMA_ORG = 'SCHEMA_ORG',
  MICRODATA = 'MICRODATA',
  HEURISTICS = 'HEURISTICS',
  AI = 'AI',
  MANUAL = 'MANUAL',
}

export interface ExtractionResult {
  success: boolean;
  recipe?: ParsedRecipeDto;
  extractionMethod: ExtractionMethod;
  confidence: number;
  aiTokensUsed?: number;
  processingTimeMs?: number;
  error?: string;
  // For frontend to show appropriate fallback UI
  requiresManualInput?: boolean;
  partialData?: Partial<ParsedRecipeDto>;
}

export interface SourceDetectionResult {
  source: UrlSource;
  isKnownRecipeSite: boolean;
  siteName?: string;
}
