/**
 * YouTube extraction job status enum
 */
export const YouTubeJobStatus = {
  PENDING: 'PENDING',
  DOWNLOADING: 'DOWNLOADING',
  EXTRACTING_AUDIO: 'EXTRACTING_AUDIO',
  TRANSCRIBING: 'TRANSCRIBING',
  EXTRACTING_FRAMES: 'EXTRACTING_FRAMES',
  OCR_PROCESSING: 'OCR_PROCESSING',
  AI_SYNTHESIS: 'AI_SYNTHESIS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type YouTubeJobStatus = (typeof YouTubeJobStatus)[keyof typeof YouTubeJobStatus];

/**
 * YouTube extraction job
 */
export interface YouTubeJob {
  id: string;
  status: YouTubeJobStatus;
  currentStep: string | null;
  progress: number;
  videoTitle: string | null;
  channelName: string | null;
  thumbnailUrl: string | null;
  videoDuration: number | null;
  framesExtracted: number;
  framesWithText: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Extracted recipe ingredient
 */
export interface ExtractedIngredient {
  quantity?: number;
  unit?: string;
  name: string;
  notes?: string;
  optional?: boolean;
}

/**
 * Extracted recipe step
 */
export interface ExtractedStep {
  order: number;
  instruction: string;
  duration?: number;
  tips?: string;
}

/**
 * Extracted recipe component
 */
export interface ExtractedComponent {
  name: string;
  ingredients: ExtractedIngredient[];
  steps: ExtractedStep[];
}

/**
 * Extracted recipe from YouTube video
 */
export interface ExtractedRecipe {
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  category?: string;
  cuisine?: string;
  tags?: string[];
  components: ExtractedComponent[];
  confidence: number;
}

/**
 * YouTube extraction result
 */
export interface YouTubeExtractionResult {
  id: string;
  videoTitle: string | null;
  channelName: string | null;
  thumbnailUrl: string | null;
  youtubeUrl: string;
  transcription: string | null;
  extractedRecipes: ExtractedRecipe[];
  importedRecipeIds: string[];
}

/**
 * Submit YouTube URL DTO
 */
export interface SubmitYouTubeDto {
  url: string;
}

/**
 * Import recipe DTO
 */
export interface ImportYouTubeRecipeDto {
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty?: string;
  category?: string;
  cuisine?: string;
  tags?: string[];
  components: ExtractedComponent[];
}

/**
 * Get human-readable status text
 */
export function getStatusText(status: YouTubeJobStatus): string {
  const statusMap: Record<YouTubeJobStatus, string> = {
    PENDING: 'Preparing...',
    DOWNLOADING: 'Downloading video...',
    EXTRACTING_AUDIO: 'Extracting audio...',
    TRANSCRIBING: 'Transcribing audio...',
    EXTRACTING_FRAMES: 'Extracting frames...',
    OCR_PROCESSING: 'Analyzing frames...',
    AI_SYNTHESIS: 'Generating recipe...',
    COMPLETED: 'Complete',
    FAILED: 'Failed',
  };
  return statusMap[status] || status;
}

/**
 * Format video duration
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
