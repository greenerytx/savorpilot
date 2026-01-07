import { Injectable, Logger } from '@nestjs/common';
import { ParsedRecipeDto } from '../../ai/dto/parse-recipe.dto';
import { ExtractionMethod, ExtractionResult } from '../dto';
import { BaseExtractor } from './base.extractor';

/**
 * Schema.org/JSON-LD Recipe Extractor (Tier 1 - FREE)
 *
 * This is the most reliable extraction method as it uses structured data
 * that websites explicitly provide for search engines and aggregators.
 *
 * Supports:
 * - Standard JSON-LD with @type: "Recipe"
 * - @graph arrays with nested recipes
 * - HowToSection groups in instructions
 * - NutritionInformation schema
 * - Video recipe schemas
 */
@Injectable()
export class SchemaOrgExtractor extends BaseExtractor {
  private readonly logger = new Logger(SchemaOrgExtractor.name);

  readonly method = ExtractionMethod.SCHEMA_ORG;
  readonly name = 'Schema.org/JSON-LD';
  readonly priority = 10;

  /**
   * Check if the HTML contains JSON-LD with Recipe type
   */
  canHandle(html: string): boolean {
    return (
      html.includes('application/ld+json') &&
      (html.includes('"@type":"Recipe"') ||
        html.includes('"@type": "Recipe"') ||
        html.includes("'@type':'Recipe'"))
    );
  }

  /**
   * Extract recipe from Schema.org JSON-LD
   */
  async extract(html: string, url: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      const schemaRecipe = this.extractSchemaOrgRecipe(html);

      if (!schemaRecipe) {
        return this.failure('No Schema.org Recipe data found');
      }

      const recipe = this.convertSchemaOrgToRecipe(schemaRecipe, url);

      // Validate extracted recipe has essential data
      if (!recipe.title || recipe.title === 'Untitled Recipe') {
        return this.failure('Recipe title not found', recipe);
      }

      if (!recipe.components?.[0]?.ingredients?.length) {
        return this.failure('No ingredients found', recipe);
      }

      // Calculate confidence based on data completeness
      const confidence = this.calculateConfidence(recipe);
      const processingTimeMs = Date.now() - startTime;

      this.logger.log(
        `Extracted recipe "${recipe.title}" via Schema.org (confidence: ${confidence.toFixed(2)}, ${processingTimeMs}ms)`,
      );

      return this.success(recipe, confidence, processingTimeMs);
    } catch (error) {
      this.logger.warn('Schema.org extraction failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Unknown extraction error',
      );
    }
  }

  /**
   * Extract Schema.org Recipe from HTML
   */
  private extractSchemaOrgRecipe(html: string): any | null {
    try {
      // Find all JSON-LD blocks
      const jsonLdRegex =
        /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      const jsonLdBlocks: any[] = [];

      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const content = match[1].trim();
          // Handle HTML entities in JSON
          const decoded = this.decodeHtmlEntities(content);
          const parsed = JSON.parse(decoded);
          jsonLdBlocks.push(parsed);
        } catch {
          // Skip invalid JSON blocks
        }
      }

      // Search for Recipe type in all blocks
      for (const block of jsonLdBlocks) {
        const recipe = this.findRecipeInSchema(block);
        if (recipe) return recipe;
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to extract Schema.org data', error);
      return null;
    }
  }

  /**
   * Recursively find Recipe in Schema.org data
   */
  private findRecipeInSchema(data: any): any | null {
    if (!data) return null;

    // Direct Recipe type
    if (data['@type'] === 'Recipe') return data;

    // Array of types (some sites use ["Recipe", "HowTo"])
    if (Array.isArray(data['@type']) && data['@type'].includes('Recipe')) {
      return data;
    }

    // Check @graph array
    if (data['@graph'] && Array.isArray(data['@graph'])) {
      for (const item of data['@graph']) {
        const recipe = this.findRecipeInSchema(item);
        if (recipe) return recipe;
      }
    }

    // Check array of items
    if (Array.isArray(data)) {
      for (const item of data) {
        const recipe = this.findRecipeInSchema(item);
        if (recipe) return recipe;
      }
    }

    return null;
  }

  /**
   * Convert Schema.org Recipe to our ParsedRecipeDto format
   */
  private convertSchemaOrgToRecipe(schema: any, url: string): ParsedRecipeDto {
    // Build ingredients array
    const ingredients = Array.isArray(schema.recipeIngredient)
      ? schema.recipeIngredient.map((ing: string) => this.parseIngredient(ing))
      : [];

    // Build steps array (handles HowToSection, HowToStep, and plain text)
    const steps = this.parseInstructions(schema.recipeInstructions);

    // Get nutrition info if available
    const nutrition = this.parseNutrition(schema.nutrition);

    return {
      title: this.normalizeText(schema.name) || 'Untitled Recipe',
      description: this.normalizeText(schema.description),
      imageUrl: this.getImage(schema.image),
      prepTimeMinutes: this.parseDuration(schema.prepTime) ?? undefined,
      cookTimeMinutes: this.parseDuration(schema.cookTime) ?? undefined,
      servings: this.parseServings(schema.recipeYield) ?? undefined,
      category: this.mapCategory(schema.recipeCategory),
      cuisine: Array.isArray(schema.recipeCuisine)
        ? schema.recipeCuisine[0]
        : schema.recipeCuisine,
      tags: this.parseTags(schema.keywords),
      components: [
        {
          name: 'Main',
          ingredients,
          steps,
        },
      ],
      confidence: 0.95,
      sourceUrl: url,
      sourceAuthor: this.getAuthor(schema.author),
      nutrition,
    } as ParsedRecipeDto;
  }

  /**
   * Parse ingredient string to structured format
   */
  private parseIngredient(ingredient: string): any {
    if (!ingredient) return { name: '', optional: false };

    const normalized = this.normalizeText(ingredient);

    // Common patterns: "2 cups flour", "1/2 tsp salt", "3 large eggs"
    const match = normalized.match(
      /^([\d¼½¾⅓⅔⅛⅜⅝⅞./\s]+)?\s*(\w+(?:\s+\w+)?)?\s*(.+)$/,
    );

    if (match) {
      let quantity: number | undefined;
      const qtyStr = match[1]?.trim();

      if (qtyStr) {
        quantity = this.parseQuantity(qtyStr);
      }

      // Common units
      const units = [
        'cup',
        'cups',
        'tbsp',
        'tsp',
        'tablespoon',
        'tablespoons',
        'teaspoon',
        'teaspoons',
        'oz',
        'ounce',
        'ounces',
        'lb',
        'lbs',
        'pound',
        'pounds',
        'g',
        'gram',
        'grams',
        'kg',
        'ml',
        'liter',
        'liters',
        'quart',
        'quarts',
        'pint',
        'pints',
        'gallon',
        'clove',
        'cloves',
        'slice',
        'slices',
        'piece',
        'pieces',
        'can',
        'cans',
        'package',
        'packages',
        'bunch',
        'bunches',
        'head',
        'heads',
        'stalk',
        'stalks',
        'large',
        'medium',
        'small',
        'pinch',
        'dash',
        'handful',
      ];

      const possibleUnit = match[2]?.toLowerCase();
      const isUnit = units.includes(possibleUnit || '');
      const unit = isUnit ? possibleUnit : undefined;
      const name = unit
        ? match[3]
        : match[2]
          ? `${match[2]} ${match[3]}`
          : match[3];

      // Separate notes from name (e.g., "onion, diced" -> name: "onion", notes: "diced")
      let finalName = name?.trim() || ingredient;
      let notes: string | undefined;

      const commaIndex = finalName.indexOf(',');
      if (commaIndex > 0) {
        notes = finalName.substring(commaIndex + 1).trim();
        finalName = finalName.substring(0, commaIndex).trim();
      }

      return {
        quantity: isNaN(quantity!) ? undefined : quantity,
        unit: unit || undefined,
        name: finalName,
        notes,
        optional:
          ingredient.toLowerCase().includes('optional') ||
          ingredient.toLowerCase().includes('to taste'),
      };
    }

    return { name: ingredient, optional: false };
  }

  /**
   * Parse quantity string including fractions
   */
  private parseQuantity(qtyStr: string): number | undefined {
    if (!qtyStr) return undefined;

    // Handle unicode fractions
    const fractionMap: Record<string, number> = {
      '¼': 0.25,
      '½': 0.5,
      '¾': 0.75,
      '⅓': 0.333,
      '⅔': 0.667,
      '⅛': 0.125,
      '⅜': 0.375,
      '⅝': 0.625,
      '⅞': 0.875,
    };

    // Check for unicode fractions
    for (const [frac, val] of Object.entries(fractionMap)) {
      if (qtyStr.includes(frac)) {
        const rest = qtyStr.replace(frac, '').trim();
        const whole = rest ? parseFloat(rest) : 0;
        return whole + val;
      }
    }

    // Handle text fractions like "1/2"
    if (qtyStr.includes('/')) {
      const parts = qtyStr.split('/');
      if (parts.length === 2) {
        // Handle "1 1/2" format
        const firstPart = parts[0].trim();
        const spaceIndex = firstPart.lastIndexOf(' ');
        if (spaceIndex > 0) {
          const whole = parseFloat(firstPart.substring(0, spaceIndex));
          const numerator = parseFloat(firstPart.substring(spaceIndex + 1));
          const denominator = parseFloat(parts[1]);
          return whole + numerator / denominator;
        }
        return parseFloat(parts[0]) / parseFloat(parts[1]);
      }
    }

    const parsed = parseFloat(qtyStr);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Parse instructions handling various Schema.org formats
   */
  private parseInstructions(instructions: any): any[] {
    if (!instructions) return [];

    // Single string - split by periods or newlines
    if (typeof instructions === 'string') {
      return this.splitInstructionString(instructions);
    }

    // Array of strings
    if (Array.isArray(instructions) && typeof instructions[0] === 'string') {
      return instructions.map((inst, idx) => ({
        order: idx + 1,
        instruction: this.normalizeText(inst),
      }));
    }

    // Array of objects (HowToStep, HowToSection, etc.)
    if (Array.isArray(instructions)) {
      const steps: any[] = [];
      let order = 1;

      for (const item of instructions) {
        // HowToSection - contains itemListElement with steps
        if (item['@type'] === 'HowToSection') {
          const sectionSteps = this.parseInstructions(item.itemListElement);
          for (const step of sectionSteps) {
            steps.push({
              order: order++,
              instruction: step.instruction,
              tips: item.name ? `${item.name}` : undefined,
            });
          }
        }
        // HowToStep
        else if (item['@type'] === 'HowToStep' || item.text) {
          steps.push({
            order: order++,
            instruction: this.normalizeText(item.text || item.name || ''),
          });
        }
        // Plain text in array
        else if (typeof item === 'string') {
          steps.push({
            order: order++,
            instruction: this.normalizeText(item),
          });
        }
      }

      return steps;
    }

    // Object with itemListElement
    if (instructions.itemListElement) {
      return this.parseInstructions(instructions.itemListElement);
    }

    return [];
  }

  /**
   * Split instruction string into steps
   */
  private splitInstructionString(str: string): any[] {
    const normalized = this.normalizeText(str);

    // Try splitting by numbered steps (1. 2. 3. or Step 1, Step 2, etc.)
    const numberedMatch = normalized.match(
      /(?:^|\n)\s*(?:step\s+)?(\d+)[.):]\s*/gi,
    );
    if (numberedMatch && numberedMatch.length > 1) {
      const steps = normalized
        .split(/(?:^|\n)\s*(?:step\s+)?\d+[.):]\s*/gi)
        .filter(Boolean);
      return steps.map((inst, idx) => ({
        order: idx + 1,
        instruction: inst.trim(),
      }));
    }

    // Split by sentences (period followed by space and capital letter)
    const sentences = normalized
      .split(/\.\s+(?=[A-Z])/)
      .filter((s) => s.trim().length > 10);
    if (sentences.length > 1) {
      return sentences.map((inst, idx) => ({
        order: idx + 1,
        instruction: inst.trim() + (inst.endsWith('.') ? '' : '.'),
      }));
    }

    // Return as single step
    return [{ order: 1, instruction: normalized }];
  }

  /**
   * Parse nutrition information
   */
  private parseNutrition(nutrition: any): any | undefined {
    if (!nutrition) return undefined;

    const parseNutrientValue = (value: any): number | undefined => {
      if (!value) return undefined;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const match = value.match(/([\d.]+)/);
        return match ? parseFloat(match[1]) : undefined;
      }
      return undefined;
    };

    return {
      caloriesPerServing: parseNutrientValue(nutrition.calories),
      proteinGrams: parseNutrientValue(nutrition.proteinContent),
      carbsGrams: parseNutrientValue(nutrition.carbohydrateContent),
      fatGrams: parseNutrientValue(nutrition.fatContent),
      fiberGrams: parseNutrientValue(nutrition.fiberContent),
      sugarGrams: parseNutrientValue(nutrition.sugarContent),
      sodiumMg: parseNutrientValue(nutrition.sodiumContent),
    };
  }

  /**
   * Get author name from various formats
   */
  private getAuthor(author: any): string | undefined {
    if (!author) return undefined;
    if (typeof author === 'string') return author;
    if (author.name) return author.name;
    if (Array.isArray(author)) return this.getAuthor(author[0]);
    return undefined;
  }

  /**
   * Get image URL from various formats
   */
  private getImage(image: any): string | undefined {
    if (!image) return undefined;
    if (typeof image === 'string') return image;
    if (image.url) return image.url;
    if (image['@id']) return image['@id'];
    if (Array.isArray(image)) return this.getImage(image[0]);
    if (image.contentUrl) return image.contentUrl;
    return undefined;
  }

  /**
   * Map recipe category to our enum values
   */
  private mapCategory(category: string | string[] | undefined): string {
    if (!category) return 'OTHER';
    const cat = Array.isArray(category) ? category[0] : category;
    const lower = cat.toLowerCase();

    const categoryMap: Record<string, string> = {
      breakfast: 'BREAKFAST',
      brunch: 'BRUNCH',
      lunch: 'LUNCH',
      dinner: 'DINNER',
      'main course': 'MAIN_COURSE',
      'main dish': 'MAIN_COURSE',
      entree: 'MAIN_COURSE',
      appetizer: 'APPETIZER',
      starter: 'APPETIZER',
      snack: 'SNACK',
      dessert: 'DESSERT',
      beverage: 'BEVERAGE',
      drink: 'BEVERAGE',
      soup: 'SOUP',
      salad: 'SALAD',
      'side dish': 'SIDE_DISH',
      side: 'SIDE_DISH',
      sauce: 'SAUCE',
      bread: 'BREAD',
      baking: 'BAKING',
    };

    for (const [key, value] of Object.entries(categoryMap)) {
      if (lower.includes(key)) return value;
    }
    return 'OTHER';
  }

  /**
   * Parse tags/keywords
   */
  private parseTags(keywords: any): string[] {
    if (!keywords) return [];
    if (typeof keywords === 'string') {
      return keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
    }
    if (Array.isArray(keywords)) {
      return keywords.filter((k) => typeof k === 'string');
    }
    return [];
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(recipe: ParsedRecipeDto): number {
    let score = 0.5; // Base score for having a valid recipe

    // Title (+0.1)
    if (recipe.title && recipe.title !== 'Untitled Recipe') score += 0.1;

    // Description (+0.05)
    if (recipe.description) score += 0.05;

    // Ingredients count (+0.15 for 3+, +0.1 for 1-2)
    const ingredientCount = recipe.components?.[0]?.ingredients?.length || 0;
    if (ingredientCount >= 3) score += 0.15;
    else if (ingredientCount > 0) score += 0.1;

    // Steps count (+0.1 for 3+, +0.05 for 1-2)
    const stepCount = recipe.components?.[0]?.steps?.length || 0;
    if (stepCount >= 3) score += 0.1;
    else if (stepCount > 0) score += 0.05;

    // Times (+0.05 each)
    if (recipe.prepTimeMinutes) score += 0.05;
    if (recipe.cookTimeMinutes) score += 0.05;

    // Servings (+0.03)
    if (recipe.servings) score += 0.03;

    // Image (+0.02)
    if (recipe.imageUrl) score += 0.02;

    return Math.min(0.99, score);
  }

  /**
   * Decode HTML entities in strings
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
