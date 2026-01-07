import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Substitution {
  substitute: string;
  ratio: number;
  notes: string;
}

export interface SubstitutionDatabase {
  [ingredient: string]: Substitution[];
}

@Injectable()
export class SubstitutionsService {
  private substitutions: SubstitutionDatabase;

  constructor() {
    // Load substitution data
    const dataPath = path.join(__dirname, 'data', 'substitutions.json');
    this.substitutions = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }

  /**
   * Get substitutes for a specific ingredient
   */
  getSubstitutes(ingredient: string): Substitution[] | null {
    const normalizedIngredient = this.normalizeIngredient(ingredient);

    // Direct match
    if (this.substitutions[normalizedIngredient]) {
      return this.substitutions[normalizedIngredient];
    }

    // Partial match (e.g., "unsalted butter" -> "butter")
    for (const key of Object.keys(this.substitutions)) {
      if (normalizedIngredient.includes(key) || key.includes(normalizedIngredient)) {
        return this.substitutions[key];
      }
    }

    return null;
  }

  /**
   * Get all available ingredients with substitutes
   */
  getAllIngredients(): string[] {
    return Object.keys(this.substitutions).sort();
  }

  /**
   * Search for ingredients by partial name
   */
  searchIngredients(query: string): string[] {
    const normalizedQuery = query.toLowerCase().trim();
    return Object.keys(this.substitutions)
      .filter(ingredient => ingredient.includes(normalizedQuery))
      .sort();
  }

  /**
   * Get substitutes for dietary restrictions
   */
  getDietarySubstitutes(
    dietaryType: 'vegan' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'egg-free' | 'nut-free',
  ): { [ingredient: string]: Substitution[] } {
    const dietaryMappings: { [key: string]: string[] } = {
      vegan: ['butter', 'egg', 'milk', 'heavy cream', 'sour cream', 'cream cheese', 'mayonnaise', 'chicken broth', 'beef broth'],
      vegetarian: ['chicken broth', 'beef broth'],
      'gluten-free': ['all-purpose flour', 'bread crumbs', 'pasta', 'soy sauce'],
      'dairy-free': ['butter', 'milk', 'heavy cream', 'sour cream', 'cream cheese', 'buttermilk'],
      'egg-free': ['egg', 'mayonnaise'],
      'nut-free': [], // Filter out nut-based substitutes from results
    };

    const relevantIngredients = dietaryMappings[dietaryType] || [];
    const result: { [ingredient: string]: Substitution[] } = {};

    for (const ingredient of relevantIngredients) {
      if (this.substitutions[ingredient]) {
        let subs = this.substitutions[ingredient];

        // For nut-free, filter out nut-based substitutes
        if (dietaryType === 'nut-free') {
          subs = subs.filter(
            s => !s.substitute.toLowerCase().includes('almond') &&
                 !s.substitute.toLowerCase().includes('cashew') &&
                 !s.substitute.toLowerCase().includes('walnut') &&
                 !s.substitute.toLowerCase().includes('peanut') &&
                 !s.substitute.toLowerCase().includes('nut'),
          );
        }

        // For vegan/dairy-free, filter out dairy-based substitutes
        if (dietaryType === 'vegan' || dietaryType === 'dairy-free') {
          subs = subs.filter(
            s => !s.substitute.toLowerCase().includes('yogurt') &&
                 !s.substitute.toLowerCase().includes('cream') &&
                 !s.substitute.toLowerCase().includes('milk') &&
                 !s.substitute.toLowerCase().includes('butter'),
          );
        }

        if (subs.length > 0) {
          result[ingredient] = subs;
        }
      }
    }

    return result;
  }

  /**
   * Calculate substitution for a given amount
   */
  calculateSubstitution(
    originalIngredient: string,
    substituteIngredient: string,
    amount: number,
    unit: string,
  ): { amount: number; unit: string; notes: string } | null {
    const subs = this.getSubstitutes(originalIngredient);
    if (!subs) return null;

    const sub = subs.find(
      s => s.substitute.toLowerCase() === substituteIngredient.toLowerCase(),
    );
    if (!sub) return null;

    return {
      amount: amount * sub.ratio,
      unit,
      notes: sub.notes,
    };
  }

  /**
   * Normalize ingredient name for matching
   */
  private normalizeIngredient(ingredient: string): string {
    return ingredient
      .toLowerCase()
      .trim()
      .replace(/^(unsalted|salted|organic|fresh|dried|ground|whole)\s+/i, '')
      .replace(/\s+(powder|juice|zest)$/i, match => match.toLowerCase());
  }
}
