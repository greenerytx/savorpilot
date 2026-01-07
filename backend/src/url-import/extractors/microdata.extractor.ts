import { Injectable, Logger } from '@nestjs/common';
import { ParsedRecipeDto } from '../../ai/dto/parse-recipe.dto';
import { ExtractionMethod, ExtractionResult } from '../dto';
import { BaseExtractor } from './base.extractor';

/**
 * Microdata/RDFa Recipe Extractor (Tier 2 - FREE)
 *
 * Extracts recipe data from HTML5 Microdata and RDFa attributes.
 * Used as fallback when JSON-LD Schema.org is not available.
 *
 * Looks for:
 * - itemscope itemtype="http://schema.org/Recipe"
 * - itemprop="recipeIngredient", itemprop="recipeInstructions"
 * - property="schema:recipeIngredient" (RDFa)
 */
@Injectable()
export class MicrodataExtractor extends BaseExtractor {
  private readonly logger = new Logger(MicrodataExtractor.name);

  readonly method = ExtractionMethod.MICRODATA;
  readonly name = 'Microdata/RDFa';
  readonly priority = 20;

  /**
   * Check if the HTML contains Microdata or RDFa recipe markup
   */
  canHandle(html: string): boolean {
    return (
      // Microdata
      (html.includes('itemtype=') &&
        (html.includes('schema.org/Recipe') ||
          html.includes('schema.org/recipe'))) ||
      // RDFa
      (html.includes('typeof=') && html.includes('Recipe')) ||
      // Common itemprop patterns
      html.includes('itemprop="recipeIngredient"') ||
      html.includes("itemprop='recipeIngredient'") ||
      html.includes('itemprop="recipeInstructions"')
    );
  }

  /**
   * Extract recipe from Microdata/RDFa markup
   */
  async extract(html: string, url: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      const recipe = this.extractMicrodata(html, url);

      if (!recipe) {
        return this.failure('No Microdata recipe markup found');
      }

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
        `Extracted recipe "${recipe.title}" via Microdata (confidence: ${confidence.toFixed(2)}, ${processingTimeMs}ms)`,
      );

      return this.success(recipe, confidence, processingTimeMs);
    } catch (error) {
      this.logger.warn('Microdata extraction failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Unknown extraction error',
      );
    }
  }

  /**
   * Extract recipe from Microdata markup
   */
  private extractMicrodata(html: string, url: string): ParsedRecipeDto | null {
    // Find recipe container (itemscope with Recipe type)
    const recipeMatch = html.match(
      /<[^>]+itemscope[^>]*itemtype=["'][^"']*schema\.org\/Recipe["'][^>]*>([\s\S]*?)(?=<[^>]+itemscope|$)/i,
    );

    if (!recipeMatch) {
      // Try finding by common recipe section patterns
      return this.extractByItemprops(html, url);
    }

    const recipeHtml = recipeMatch[0];
    return this.parseRecipeSection(recipeHtml, url);
  }

  /**
   * Extract by finding itemprop attributes directly
   */
  private extractByItemprops(html: string, url: string): ParsedRecipeDto | null {
    // Try to find ingredients and instructions even without a proper container
    const ingredients = this.extractItemprops(html, 'recipeIngredient');
    const instructions = this.extractItemprops(html, 'recipeInstructions');

    if (ingredients.length === 0) {
      return null;
    }

    const title = this.extractSingleItemprop(html, 'name') || 'Untitled Recipe';
    const description = this.extractSingleItemprop(html, 'description');
    const imageUrl = this.extractSingleItemprop(html, 'image');
    const prepTime = this.extractSingleItemprop(html, 'prepTime');
    const cookTime = this.extractSingleItemprop(html, 'cookTime');
    const recipeYield = this.extractSingleItemprop(html, 'recipeYield');
    const author = this.extractSingleItemprop(html, 'author');

    return {
      title: this.normalizeText(title),
      description: this.normalizeText(description) || undefined,
      imageUrl: imageUrl || undefined,
      prepTimeMinutes: this.parseDuration(prepTime) ?? undefined,
      cookTimeMinutes: this.parseDuration(cookTime) ?? undefined,
      servings: this.parseServings(recipeYield) ?? undefined,
      components: [
        {
          name: 'Main',
          ingredients: ingredients.map((ing) => this.parseIngredient(ing)),
          steps: instructions.map((inst, idx) => ({
            order: idx + 1,
            instruction: this.normalizeText(inst),
          })),
        },
      ],
      confidence: 0.8,
      sourceUrl: url,
      sourceAuthor: author || undefined,
    } as ParsedRecipeDto;
  }

  /**
   * Parse recipe from a specific HTML section
   */
  private parseRecipeSection(html: string, url: string): ParsedRecipeDto {
    const title = this.extractSingleItemprop(html, 'name') || 'Untitled Recipe';
    const description = this.extractSingleItemprop(html, 'description');
    const imageUrl = this.extractSingleItemprop(html, 'image');
    const prepTime = this.extractSingleItemprop(html, 'prepTime');
    const cookTime = this.extractSingleItemprop(html, 'cookTime');
    const recipeYield = this.extractSingleItemprop(html, 'recipeYield');
    const author = this.extractSingleItemprop(html, 'author');
    const category = this.extractSingleItemprop(html, 'recipeCategory');
    const cuisine = this.extractSingleItemprop(html, 'recipeCuisine');

    const ingredients = this.extractItemprops(html, 'recipeIngredient');
    const instructions = this.extractItemprops(html, 'recipeInstructions');

    return {
      title: this.normalizeText(title),
      description: this.normalizeText(description) || undefined,
      imageUrl: imageUrl || undefined,
      prepTimeMinutes: this.parseDuration(prepTime) ?? undefined,
      cookTimeMinutes: this.parseDuration(cookTime) ?? undefined,
      servings: this.parseServings(recipeYield) ?? undefined,
      category: this.mapCategory(category),
      cuisine: cuisine || undefined,
      components: [
        {
          name: 'Main',
          ingredients: ingredients.map((ing) => this.parseIngredient(ing)),
          steps: instructions.map((inst, idx) => ({
            order: idx + 1,
            instruction: this.normalizeText(inst),
          })),
        },
      ],
      confidence: 0.85,
      sourceUrl: url,
      sourceAuthor: author || undefined,
    } as ParsedRecipeDto;
  }

  /**
   * Extract all values for a specific itemprop
   */
  private extractItemprops(html: string, propName: string): string[] {
    const values: string[] = [];

    // Pattern 1: itemprop on elements with content
    const pattern1 = new RegExp(
      `<[^>]+itemprop=["']${propName}["'][^>]*>([^<]*)<`,
      'gi',
    );
    let match;
    while ((match = pattern1.exec(html)) !== null) {
      const content = match[1].trim();
      if (content) values.push(content);
    }

    // Pattern 2: itemprop with content attribute
    const pattern2 = new RegExp(
      `<[^>]+itemprop=["']${propName}["'][^>]*content=["']([^"']+)["']`,
      'gi',
    );
    while ((match = pattern2.exec(html)) !== null) {
      values.push(match[1].trim());
    }

    // Pattern 3: content attribute before itemprop
    const pattern3 = new RegExp(
      `<[^>]+content=["']([^"']+)["'][^>]*itemprop=["']${propName}["']`,
      'gi',
    );
    while ((match = pattern3.exec(html)) !== null) {
      values.push(match[1].trim());
    }

    // Pattern 4: Nested text content within itemprop elements
    const pattern4 = new RegExp(
      `<[^>]+itemprop=["']${propName}["'][^>]*>([\\s\\S]*?)<\\/`,
      'gi',
    );
    while ((match = pattern4.exec(html)) !== null) {
      const innerHtml = match[1];
      // Strip nested tags and get text
      const textContent = innerHtml.replace(/<[^>]+>/g, ' ').trim();
      if (textContent && !values.includes(textContent)) {
        values.push(textContent);
      }
    }

    return [...new Set(values)].filter(Boolean);
  }

  /**
   * Extract single value for itemprop
   */
  private extractSingleItemprop(html: string, propName: string): string | null {
    const values = this.extractItemprops(html, propName);
    return values[0] || null;
  }

  /**
   * Parse ingredient string to structured format
   */
  private parseIngredient(ingredient: string): any {
    const normalized = this.normalizeText(ingredient);

    // Common pattern: "2 cups flour" or "1/2 tsp salt"
    const match = normalized.match(
      /^([\d¼½¾⅓⅔⅛⅜⅝⅞./\s]+)?\s*(\w+(?:\s+\w+)?)?\s*(.+)$/,
    );

    if (match) {
      const qtyStr = match[1]?.trim();
      const quantity = qtyStr ? this.parseQuantity(qtyStr) : undefined;

      const units = [
        'cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons',
        'teaspoon', 'teaspoons', 'oz', 'ounce', 'ounces', 'lb', 'lbs',
        'pound', 'pounds', 'g', 'gram', 'grams', 'kg', 'ml', 'liter',
        'liters', 'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces',
        'can', 'cans', 'large', 'medium', 'small', 'pinch', 'dash',
      ];

      const possibleUnit = match[2]?.toLowerCase();
      const isUnit = units.includes(possibleUnit || '');
      const unit = isUnit ? possibleUnit : undefined;
      const name = unit
        ? match[3]
        : match[2]
          ? `${match[2]} ${match[3]}`
          : match[3];

      return {
        quantity: isNaN(quantity!) ? undefined : quantity,
        unit: unit || undefined,
        name: name?.trim() || ingredient,
        optional: ingredient.toLowerCase().includes('optional'),
      };
    }

    return { name: ingredient, optional: false };
  }

  /**
   * Parse quantity including fractions
   */
  private parseQuantity(qtyStr: string): number | undefined {
    const fractionMap: Record<string, number> = {
      '¼': 0.25, '½': 0.5, '¾': 0.75,
      '⅓': 0.333, '⅔': 0.667,
      '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
    };

    for (const [frac, val] of Object.entries(fractionMap)) {
      if (qtyStr.includes(frac)) {
        const rest = qtyStr.replace(frac, '').trim();
        const whole = rest ? parseFloat(rest) : 0;
        return whole + val;
      }
    }

    if (qtyStr.includes('/')) {
      const parts = qtyStr.split('/');
      if (parts.length === 2) {
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
   * Map category to our enum
   */
  private mapCategory(category: string | null): string {
    if (!category) return 'OTHER';
    const lower = category.toLowerCase();

    const categoryMap: Record<string, string> = {
      breakfast: 'BREAKFAST', brunch: 'BRUNCH', lunch: 'LUNCH',
      dinner: 'DINNER', 'main course': 'MAIN_COURSE', entree: 'MAIN_COURSE',
      appetizer: 'APPETIZER', snack: 'SNACK', dessert: 'DESSERT',
      beverage: 'BEVERAGE', soup: 'SOUP', salad: 'SALAD',
      'side dish': 'SIDE_DISH', sauce: 'SAUCE', bread: 'BREAD',
    };

    for (const [key, value] of Object.entries(categoryMap)) {
      if (lower.includes(key)) return value;
    }
    return 'OTHER';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(recipe: ParsedRecipeDto): number {
    let score = 0.4;

    if (recipe.title && recipe.title !== 'Untitled Recipe') score += 0.1;
    if (recipe.description) score += 0.05;

    const ingredientCount = recipe.components?.[0]?.ingredients?.length || 0;
    if (ingredientCount >= 3) score += 0.15;
    else if (ingredientCount > 0) score += 0.1;

    const stepCount = recipe.components?.[0]?.steps?.length || 0;
    if (stepCount >= 3) score += 0.15;
    else if (stepCount > 0) score += 0.1;

    if (recipe.prepTimeMinutes) score += 0.05;
    if (recipe.cookTimeMinutes) score += 0.05;
    if (recipe.servings) score += 0.03;
    if (recipe.imageUrl) score += 0.02;

    return Math.min(0.95, score);
  }
}
