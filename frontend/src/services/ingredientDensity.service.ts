/**
 * Service for fetching ingredient density from AI with caching
 */

import { api } from './api';
import type { IngredientType, IngredientDensity } from '../utils/ingredientDensity';

const CACHE_KEY = 'gramgrab_ingredient_densities';
const CACHE_EXPIRY_DAYS = 30;

interface CachedDensity extends IngredientDensity {
  fetchedAt: number;
  confidence: number;
}

interface DensityCache {
  [ingredientName: string]: CachedDensity;
}

/**
 * Load the density cache from localStorage
 */
function loadCache(): DensityCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Failed to load ingredient density cache:', error);
  }
  return {};
}

/**
 * Save the density cache to localStorage
 */
function saveCache(cache: DensityCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save ingredient density cache:', error);
  }
}

/**
 * Check if a cached entry is still valid
 */
function isCacheValid(entry: CachedDensity): boolean {
  const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - entry.fetchedAt < expiryMs;
}

/**
 * In-memory cache for current session (faster than localStorage)
 */
const memoryCache: DensityCache = loadCache();

/**
 * Pending requests to avoid duplicate API calls
 */
const pendingRequests = new Map<string, Promise<IngredientDensity | null>>();

/**
 * Fetch ingredient density from AI backend
 * Returns null if the request fails
 */
async function fetchFromAI(ingredientName: string): Promise<IngredientDensity | null> {
  try {
    const response = await api.post<{
      gramsPerCup: number;
      type: IngredientType;
      confidence: number;
    }>('/ai/ingredient-density', { ingredientName });

    const { gramsPerCup, type, confidence } = response.data;

    // Only cache if confidence is reasonable
    if (confidence >= 0.5) {
      const cachedEntry: CachedDensity = {
        gramsPerCup,
        type,
        confidence,
        fetchedAt: Date.now(),
      };

      // Update both memory and localStorage cache
      memoryCache[ingredientName.toLowerCase()] = cachedEntry;
      saveCache(memoryCache);

      return { gramsPerCup, type };
    }

    // Low confidence - return but don't cache
    return { gramsPerCup, type };
  } catch (error) {
    console.warn(`Failed to fetch density for "${ingredientName}":`, error);
    return null;
  }
}

/**
 * Get ingredient density from cache or AI
 * This is an async function - use getIngredientDensitySync for synchronous access
 */
export async function getIngredientDensityAsync(
  ingredientName: string
): Promise<IngredientDensity | null> {
  const normalizedName = ingredientName.toLowerCase().trim();

  // Check memory cache first
  const cached = memoryCache[normalizedName];
  if (cached && isCacheValid(cached)) {
    return { gramsPerCup: cached.gramsPerCup, type: cached.type };
  }

  // Check if there's already a pending request for this ingredient
  const pending = pendingRequests.get(normalizedName);
  if (pending) {
    return pending;
  }

  // Create new request
  const request = fetchFromAI(normalizedName);
  pendingRequests.set(normalizedName, request);

  try {
    const result = await request;
    return result;
  } finally {
    pendingRequests.delete(normalizedName);
  }
}

/**
 * Synchronously get cached ingredient density (for use in render)
 * Returns null if not in cache - caller should trigger async fetch separately
 */
export function getIngredientDensityFromCache(
  ingredientName: string
): IngredientDensity | null {
  const normalizedName = ingredientName.toLowerCase().trim();
  const cached = memoryCache[normalizedName];

  if (cached && isCacheValid(cached)) {
    return { gramsPerCup: cached.gramsPerCup, type: cached.type };
  }

  return null;
}

/**
 * Prefetch densities for multiple ingredients (useful for batch loading)
 */
export async function prefetchIngredientDensities(
  ingredientNames: string[]
): Promise<void> {
  const uncached = ingredientNames.filter((name) => {
    const normalized = name.toLowerCase().trim();
    const cached = memoryCache[normalized];
    return !cached || !isCacheValid(cached);
  });

  // Fetch uncached ingredients in parallel (limit to 5 concurrent)
  const batchSize = 5;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    await Promise.all(batch.map((name) => getIngredientDensityAsync(name)));
  }
}

/**
 * Clear the ingredient density cache
 */
export function clearDensityCache(): void {
  Object.keys(memoryCache).forEach((key) => delete memoryCache[key]);
  localStorage.removeItem(CACHE_KEY);
}
