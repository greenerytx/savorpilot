// Instagram Saved Posts Types

export const SavedPostStatus = {
  PENDING: 'PENDING',
  IMPORTED: 'IMPORTED',
  DISMISSED: 'DISMISSED',
  FAILED: 'FAILED',
} as const;
export type SavedPostStatus = (typeof SavedPostStatus)[keyof typeof SavedPostStatus];

export const ImportJobStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type ImportJobStatus = (typeof ImportJobStatus)[keyof typeof ImportJobStatus];

export interface SavedInstagramPost {
  id: string;
  instagramPostId: string;
  shortcode: string;
  caption: string | null;
  captionTranslated: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  ownerUsername: string;
  ownerFullName: string | null;
  ownerId: string;
  postedAt: string | null;
  isVideo: boolean;
  likeCount: number | null;
  commentCount: number | null;
  collectionId: string | null;
  collectionName: string | null;
  status: SavedPostStatus;
  importedRecipeId: string | null;
  detectedLanguage: string | null;
  fetchedAt: string;
  importedAt: string | null;
}

export interface SavedPostsListResponse {
  posts: SavedInstagramPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SortField = 'fetchedAt' | 'savedAt' | 'postedAt' | 'ownerUsername' | 'likeCount' | 'commentCount';
export type SortOrder = 'asc' | 'desc';

export interface SavedPostsQuery {
  status?: SavedPostStatus;
  ownerUsername?: string;
  collectionName?: string;
  search?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface FiltersResponse {
  usernames: { username: string; count: number }[];
  collections: { name: string; count: number }[];
  statusCounts: { status: SavedPostStatus; count: number }[];
}

export interface SyncInstagramDto {
  sessionId: string;
  csrfToken: string;
  dsUserId?: string;
}

export interface SyncResponse {
  success: boolean;
  totalFetched: number;
  newPosts: number;
  skippedPosts: number;
  message?: string;
}

export interface ParsedInstagramPost {
  title: string;
  description?: string;
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
  confidence: number;
  detectedLanguage?: string;
  needsTranslation?: boolean;
  hasSteps: boolean;
}

export interface ImportSinglePostDto {
  title: string;
  description?: string;
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
}

export interface BulkImportDto {
  postIds: string[];
}

export interface BulkImportResponse {
  jobId: string;
  status: string;
  totalPosts: number;
  message: string;
}

export interface ImportJobStatus {
  id: string;
  status: ImportJobStatus;
  totalPosts: number;
  processedPosts: number;
  successfulPosts: number;
  failedPosts: number;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GenerateStepsDto {
  title: string;
  ingredients: { quantity?: number; unit?: string; name: string }[];
}

export interface GeneratedSteps {
  steps: { order: number; instruction: string; duration?: number; tips?: string }[];
}

export interface ReloadImageDto {
  sessionId: string;
  csrfToken: string;
  dsUserId?: string;
  igWwwClaim?: string;
}

export interface BulkReloadImagesDto extends ReloadImageDto {
  postIds: string[];
}

export interface ReloadImageResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
}

export interface BulkReloadImagesResponse {
  success: number;
  failed: number;
  results: { postId: string; success: boolean; message?: string }[];
}
