import { Injectable, Logger } from '@nestjs/common';
import { ParsedRecipeDto } from '../../ai/dto/parse-recipe.dto';
import { ExtractionMethod, ExtractionResult } from '../dto';
import { BaseExtractor } from './base.extractor';

/**
 * HTML Heuristics Recipe Extractor (Tier 3 - FREE)
 *
 * Uses common CSS class patterns and HTML structure to extract recipes.
 * Targets popular WordPress recipe plugins and common recipe site patterns.
 *
 * Supported plugins/patterns:
 * - WP Recipe Maker (WPRM)
 * - Tasty Recipes
 * - Recipe Card Blocks
 * - Flavor theme
 * - Common class patterns (.ingredients, .instructions, etc.)
 */
@Injectable()
export class HeuristicsExtractor extends BaseExtractor {
  private readonly logger = new Logger(HeuristicsExtractor.name);

  readonly method = ExtractionMethod.HEURISTICS;
  readonly name = 'HTML Heuristics';
  readonly priority = 30;

  // CSS selectors for finding recipe elements
  private readonly TITLE_SELECTORS = [
    '.wprm-recipe-name',
    '.tasty-recipes-title',
    '.recipe-title',
    '.recipe-name',
    '.recipe-card-title',
    'h1.entry-title',
    'h2.recipe-title',
    '[class*="recipe-title"]',
    '[class*="recipe-name"]',
  ];

  private readonly INGREDIENT_CONTAINER_SELECTORS = [
    '.wprm-recipe-ingredients',
    '.tasty-recipes-ingredients',
    '.recipe-ingredients',
    '.ingredients-section',
    '.ingredient-list',
    '.ingredients',
    '[class*="recipe-ingredients"]',
    '[class*="ingredient-list"]',
  ];

  private readonly INGREDIENT_ITEM_SELECTORS = [
    '.wprm-recipe-ingredient',
    '.tasty-recipes-ingredient',
    '.ingredient',
    '.recipe-ingredient',
    'li[class*="ingredient"]',
  ];

  private readonly INSTRUCTION_CONTAINER_SELECTORS = [
    '.wprm-recipe-instructions',
    '.tasty-recipes-instructions',
    '.recipe-instructions',
    '.instructions-section',
    '.instruction-list',
    '.directions',
    '.steps',
    '.method',
    '[class*="recipe-instructions"]',
    '[class*="recipe-steps"]',
  ];

  private readonly INSTRUCTION_ITEM_SELECTORS = [
    '.wprm-recipe-instruction',
    '.tasty-recipes-instruction',
    '.instruction',
    '.recipe-step',
    '.step',
    'li[class*="instruction"]',
    'li[class*="step"]',
  ];

  private readonly DESCRIPTION_SELECTORS = [
    '.wprm-recipe-summary',
    '.tasty-recipes-description',
    '.recipe-description',
    '.recipe-summary',
    '[class*="recipe-description"]',
    '[class*="recipe-summary"]',
  ];

  private readonly TIME_SELECTORS = {
    prep: [
      '.wprm-recipe-prep-time',
      '.tasty-recipes-prep-time',
      '.prep-time',
      '[class*="prep-time"]',
    ],
    cook: [
      '.wprm-recipe-cook-time',
      '.tasty-recipes-cook-time',
      '.cook-time',
      '[class*="cook-time"]',
    ],
    total: [
      '.wprm-recipe-total-time',
      '.tasty-recipes-total-time',
      '.total-time',
      '[class*="total-time"]',
    ],
  };

  private readonly SERVINGS_SELECTORS = [
    '.wprm-recipe-servings',
    '.tasty-recipes-yield',
    '.recipe-yield',
    '.servings',
    '[class*="servings"]',
    '[class*="yield"]',
  ];

  /**
   * Check if HTML has common recipe class patterns
   */
  canHandle(html: string): boolean {
    const recipePatterns = [
      'wprm-recipe',
      'tasty-recipes',
      'recipe-card',
      'recipe-ingredients',
      'recipe-instructions',
      'class="ingredients"',
      'class="instructions"',
      'class="recipe"',
    ];

    return recipePatterns.some((pattern) =>
      html.toLowerCase().includes(pattern.toLowerCase()),
    );
  }

  /**
   * Extract recipe using heuristic patterns
   */
  async extract(html: string, url: string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      const recipe = this.extractByHeuristics(html, url);

      if (!recipe) {
        return this.failure('No recipe patterns found');
      }

      if (!recipe.components?.[0]?.ingredients?.length) {
        return this.failure('No ingredients found', recipe);
      }

      const confidence = this.calculateConfidence(recipe);
      const processingTimeMs = Date.now() - startTime;

      this.logger.log(
        `Extracted recipe "${recipe.title}" via Heuristics (confidence: ${confidence.toFixed(2)}, ${processingTimeMs}ms)`,
      );

      return this.success(recipe, confidence, processingTimeMs);
    } catch (error) {
      this.logger.warn('Heuristics extraction failed', error);
      return this.failure(
        error instanceof Error ? error.message : 'Unknown extraction error',
      );
    }
  }

  /**
   * Main extraction method using heuristics
   */
  private extractByHeuristics(html: string, url: string): ParsedRecipeDto | null {
    // Find recipe container
    const recipeContainer = this.findRecipeContainer(html);
    const searchHtml = recipeContainer || html;

    // Extract title
    const title = this.extractBySelectors(searchHtml, this.TITLE_SELECTORS);

    // Extract ingredients
    const ingredients = this.extractIngredients(searchHtml);

    // If no ingredients found, this isn't a valid recipe
    if (ingredients.length === 0) {
      return null;
    }

    // Extract instructions
    const instructions = this.extractInstructions(searchHtml);

    // Extract other fields
    const description = this.extractBySelectors(searchHtml, this.DESCRIPTION_SELECTORS);
    const prepTime = this.extractTime(searchHtml, 'prep');
    const cookTime = this.extractTime(searchHtml, 'cook');
    const servings = this.extractServings(searchHtml);
    const imageUrl = this.extractRecipeImage(searchHtml);

    return {
      title: this.normalizeText(title) || this.extractTitleFromPage(html) || 'Untitled Recipe',
      description: this.normalizeText(description) || undefined,
      imageUrl: imageUrl || undefined,
      prepTimeMinutes: prepTime ?? undefined,
      cookTimeMinutes: cookTime ?? undefined,
      servings: servings ?? undefined,
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
      confidence: 0.7,
      sourceUrl: url,
    } as ParsedRecipeDto;
  }

  /**
   * Find the main recipe container
   */
  private findRecipeContainer(html: string): string | null {
    const containerPatterns = [
      /<div[^>]*class="[^"]*wprm-recipe[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*wprm-recipe|$)/i,
      /<div[^>]*class="[^"]*tasty-recipes[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*tasty-recipes|$)/i,
      /<div[^>]*class="[^"]*recipe-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*recipe-card|$)/i,
      /<article[^>]*class="[^"]*recipe[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
    ];

    for (const pattern of containerPatterns) {
      const match = html.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * Extract text by trying multiple CSS-style selectors
   */
  private extractBySelectors(html: string, selectors: string[]): string | null {
    for (const selector of selectors) {
      const text = this.extractBySelector(html, selector);
      if (text) return text;
    }
    return null;
  }

  /**
   * Extract text matching a CSS-style selector
   */
  private extractBySelector(html: string, selector: string): string | null {
    let pattern: RegExp;

    if (selector.startsWith('.')) {
      // Class selector
      const className = selector.slice(1);
      pattern = new RegExp(
        `<[^>]+class="[^"]*${this.escapeRegex(className)}[^"]*"[^>]*>([^<]*)<`,
        'i',
      );
    } else if (selector.startsWith('[class*="')) {
      // Partial class match
      const partialClass = selector.match(/\[class\*="([^"]+)"\]/)?.[1];
      if (partialClass) {
        pattern = new RegExp(
          `<[^>]+class="[^"]*${this.escapeRegex(partialClass)}[^"]*"[^>]*>([^<]*)<`,
          'i',
        );
      } else {
        return null;
      }
    } else if (selector.includes('.')) {
      // Tag with class (e.g., h1.entry-title)
      const [tag, className] = selector.split('.');
      pattern = new RegExp(
        `<${tag}[^>]+class="[^"]*${this.escapeRegex(className)}[^"]*"[^>]*>([^<]*)<`,
        'i',
      );
    } else {
      return null;
    }

    const match = html.match(pattern);
    if (match?.[1]) {
      const text = match[1].trim();
      if (text) return text;
    }

    // Try to get nested text content
    const containerPattern = new RegExp(
      `<[^>]+class="[^"]*${this.escapeRegex(selector.replace(/[\.\[\]"*=]/g, ''))}[^"]*"[^>]*>([\\s\\S]*?)<\\/`,
      'i',
    );
    const containerMatch = html.match(containerPattern);
    if (containerMatch?.[1]) {
      const text = containerMatch[1].replace(/<[^>]+>/g, ' ').trim();
      if (text) return text;
    }

    return null;
  }

  /**
   * Extract ingredients using multiple strategies
   */
  private extractIngredients(html: string): string[] {
    const ingredients: string[] = [];

    // Strategy 1: Find ingredient container and extract items
    for (const containerSelector of this.INGREDIENT_CONTAINER_SELECTORS) {
      const container = this.findContainer(html, containerSelector);
      if (container) {
        const items = this.extractListItems(container);
        if (items.length > 0) {
          return items;
        }
      }
    }

    // Strategy 2: Find individual ingredient items
    for (const itemSelector of this.INGREDIENT_ITEM_SELECTORS) {
      const items = this.extractByClassPattern(html, itemSelector);
      if (items.length > 0) {
        return items;
      }
    }

    // Strategy 3: Look for ul/ol near "ingredient" text
    const ingredientSectionMatch = html.match(
      /(?:ingredients?|what you(?:'ll)? need)[^<]*<(?:ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>/i,
    );
    if (ingredientSectionMatch) {
      const listItems = ingredientSectionMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      if (listItems) {
        return listItems.map((li) =>
          li.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        ).filter(Boolean);
      }
    }

    return ingredients;
  }

  /**
   * Extract instructions using multiple strategies
   */
  private extractInstructions(html: string): string[] {
    const instructions: string[] = [];

    // Strategy 1: Find instruction container and extract items
    for (const containerSelector of this.INSTRUCTION_CONTAINER_SELECTORS) {
      const container = this.findContainer(html, containerSelector);
      if (container) {
        const items = this.extractListItems(container);
        if (items.length > 0) {
          return items;
        }
      }
    }

    // Strategy 2: Find individual instruction items
    for (const itemSelector of this.INSTRUCTION_ITEM_SELECTORS) {
      const items = this.extractByClassPattern(html, itemSelector);
      if (items.length > 0) {
        return items;
      }
    }

    // Strategy 3: Look for ol near "instruction" or "direction" text
    const instructionSectionMatch = html.match(
      /(?:instructions?|directions?|steps?|method)[^<]*<(?:ol|ul)[^>]*>([\s\S]*?)<\/(?:ol|ul)>/i,
    );
    if (instructionSectionMatch) {
      const listItems = instructionSectionMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      if (listItems) {
        return listItems.map((li) =>
          li.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        ).filter(Boolean);
      }
    }

    return instructions;
  }

  /**
   * Find a container matching a selector
   */
  private findContainer(html: string, selector: string): string | null {
    const className = selector.replace(/[\.\[\]"*=]/g, '');
    const pattern = new RegExp(
      `<[^>]+class="[^"]*${this.escapeRegex(className)}[^"]*"[^>]*>([\\s\\S]*?)(?=<\\/div>|<\\/section>|<\\/ul>|<\\/ol>)`,
      'i',
    );
    const match = html.match(pattern);
    return match ? match[0] : null;
  }

  /**
   * Extract list items from HTML
   */
  private extractListItems(html: string): string[] {
    const items: string[] = [];
    const listItemPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match;

    while ((match = listItemPattern.exec(html)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) {
        items.push(text);
      }
    }

    return items;
  }

  /**
   * Extract elements by class pattern
   */
  private extractByClassPattern(html: string, selector: string): string[] {
    const className = selector.replace(/[\.\[\]"*=li]/g, '').trim();
    const pattern = new RegExp(
      `<[^>]+class="[^"]*${this.escapeRegex(className)}[^"]*"[^>]*>([\\s\\S]*?)<\\/`,
      'gi',
    );

    const items: string[] = [];
    let match;

    while ((match = pattern.exec(html)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) {
        items.push(text);
      }
    }

    return items;
  }

  /**
   * Extract time (prep/cook/total)
   */
  private extractTime(html: string, type: 'prep' | 'cook' | 'total'): number | null {
    const selectors = this.TIME_SELECTORS[type];
    const timeText = this.extractBySelectors(html, selectors);

    if (timeText) {
      return this.parseDuration(timeText);
    }

    return null;
  }

  /**
   * Extract servings
   */
  private extractServings(html: string): number | null {
    const servingsText = this.extractBySelectors(html, this.SERVINGS_SELECTORS);
    return this.parseServings(servingsText);
  }

  /**
   * Extract recipe image
   */
  private extractRecipeImage(html: string): string | null {
    // Try recipe-specific image classes
    const imagePatterns = [
      /<img[^>]+class="[^"]*wprm-recipe-image[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]+class="[^"]*tasty-recipes-image[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]+class="[^"]*recipe-image[^"]*"[^>]*src="([^"]+)"/i,
    ];

    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1];
    }

    // Fallback to og:image
    const ogImage = html.match(
      /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
    );
    if (ogImage?.[1]) return ogImage[1];

    return null;
  }

  /**
   * Extract title from page when recipe title not found
   */
  private extractTitleFromPage(html: string): string | null {
    // Try h1
    const h1Match = html.match(/<h1[^>]*>([^<]+)</i);
    if (h1Match?.[1]) return h1Match[1].trim();

    // Try og:title
    const ogTitle = html.match(
      /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    );
    if (ogTitle?.[1]) return ogTitle[1].trim();

    // Try title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
    if (titleMatch?.[1]) {
      // Remove common suffixes
      return titleMatch[1]
        .split(/[|\-–—]/)[0]
        .trim();
    }

    return null;
  }

  /**
   * Parse ingredient string
   */
  private parseIngredient(ingredient: string): any {
    const normalized = this.normalizeText(ingredient);

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
        'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces',
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
   * Parse quantity
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
        return parseFloat(parts[0]) / parseFloat(parts[1]);
      }
    }

    const parsed = parseFloat(qtyStr);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(recipe: ParsedRecipeDto): number {
    let score = 0.3;

    if (recipe.title && recipe.title !== 'Untitled Recipe') score += 0.1;
    if (recipe.description) score += 0.05;

    const ingredientCount = recipe.components?.[0]?.ingredients?.length || 0;
    if (ingredientCount >= 5) score += 0.2;
    else if (ingredientCount >= 3) score += 0.15;
    else if (ingredientCount > 0) score += 0.1;

    const stepCount = recipe.components?.[0]?.steps?.length || 0;
    if (stepCount >= 4) score += 0.2;
    else if (stepCount >= 2) score += 0.15;
    else if (stepCount > 0) score += 0.1;

    if (recipe.prepTimeMinutes) score += 0.05;
    if (recipe.cookTimeMinutes) score += 0.05;
    if (recipe.servings) score += 0.03;
    if (recipe.imageUrl) score += 0.02;

    return Math.min(0.9, score);
  }
}
