import { api, publicApi } from './api';
import type { Recipe } from '../types/recipe';

export type ReactionType = 'FIRE' | 'WANT' | 'DROOLING' | 'MADE_IT';

export interface ReactionStats {
  recipeId: string;
  counts: {
    fire: number;
    want: number;
    drooling: number;
    madeIt: number;
    total: number;
  };
  userReactions: ReactionType[];
}

export interface PublicRecipe extends Recipe {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
}

export interface TrendingRecipe {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  cuisine?: string | null;
  difficulty?: string;
  forkCount: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
}

// Public API (no auth required)
export const publicService = {
  // Get public recipe by ID
  async getPublicRecipe(id: string): Promise<PublicRecipe> {
    const response = await publicApi.get(`/public/recipes/${id}`);
    return response.data;
  },

  // Get public recipes with pagination
  async getPublicRecipes(params?: {
    page?: number;
    limit?: number;
    search?: string;
    cuisine?: string;
    category?: string;
    sortBy?: 'createdAt' | 'forkCount' | 'title';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: PublicRecipe[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const response = await publicApi.get('/public/recipes', { params });
    return response.data;
  },

  // Get trending recipes
  async getTrendingRecipes(limit = 10): Promise<TrendingRecipe[]> {
    const response = await publicApi.get('/public/recipes/trending', {
      params: { limit },
    });
    return response.data;
  },

  // Get chef's public recipes
  async getChefRecipes(userId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    chef: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
      _count: { recipes: number; followers: number };
    };
    recipes: {
      data: PublicRecipe[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    const response = await publicApi.get(`/public/chefs/${userId}/recipes`, { params });
    return response.data;
  },
};

// Reactions API (auth required for adding/removing, public for viewing)
export const reactionsService = {
  // Add a reaction
  async addReaction(recipeId: string, type: ReactionType): Promise<void> {
    await api.post(`/recipes/${recipeId}/reactions/${type}`);
  },

  // Remove a reaction
  async removeReaction(recipeId: string, type: ReactionType): Promise<void> {
    await api.delete(`/recipes/${recipeId}/reactions/${type}`);
  },

  // Get reaction stats for a recipe
  async getReactionStats(recipeId: string): Promise<ReactionStats> {
    const response = await api.get(`/recipes/${recipeId}/reactions`);
    return response.data;
  },

  // Toggle a reaction (add if not exists, remove if exists)
  async toggleReaction(recipeId: string, type: ReactionType, currentlyActive: boolean): Promise<void> {
    if (currentlyActive) {
      await this.removeReaction(recipeId, type);
    } else {
      await this.addReaction(recipeId, type);
    }
  },
};

// Substitutions API (public)
export interface Substitution {
  substitute: string;
  ratio: number;
  notes: string;
}

export const substitutionsService = {
  // Get substitutes for an ingredient
  async getSubstitutes(ingredient: string): Promise<{
    ingredient: string;
    found: boolean;
    substitutes: Substitution[];
    suggestions?: string[];
  }> {
    const response = await publicApi.get(`/substitutions/${encodeURIComponent(ingredient)}`);
    return response.data;
  },

  // Search for ingredients
  async searchIngredients(query: string): Promise<{ results: string[] }> {
    const response = await publicApi.get('/substitutions/search', {
      params: { q: query },
    });
    return response.data;
  },

  // Get dietary-specific substitutes
  async getDietarySubstitutes(
    type: 'vegan' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'egg-free' | 'nut-free',
  ): Promise<{
    dietaryType: string;
    substitutes: { [ingredient: string]: Substitution[] };
  }> {
    const response = await publicApi.get(`/substitutions/dietary/${type}`);
    return response.data;
  },

  // Calculate substitution amount
  async calculateSubstitution(
    ingredient: string,
    substitute: string,
    amount: number,
    unit: string,
  ): Promise<{
    original: { ingredient: string; amount: number; unit: string };
    substitution: { ingredient: string; amount: number; unit: string; notes: string };
  } | { error: string }> {
    const response = await publicApi.get(`/substitutions/${encodeURIComponent(ingredient)}/calculate`, {
      params: { substitute, amount, unit },
    });
    return response.data;
  },
};
