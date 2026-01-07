import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AllergenMappingService,
  IngredientConflict,
  RecipeComponent,
} from './allergen-mapping.service';

export interface MemberConflict {
  memberId: string;
  memberName: string;
  avatarEmoji?: string;
  allergenConflicts: IngredientConflict[];
  restrictionConflicts: IngredientConflict[];
}

export interface CompatibilityReport {
  recipeId: string;
  circleId: string;
  circleName: string;
  isCompatible: boolean;
  memberConflicts: MemberConflict[];
  allConflictingIngredients: string[];
  allConflictingAllergens: string[];
  allConflictingRestrictions: string[];
  safeForMembers: Array<{ memberId: string; memberName: string }>;
  summary: string;
  languageSupported: boolean;
  detectedLanguage?: string;
}

export interface RecipeCompatibilityInfo {
  recipeId: string;
  detectedAllergens: string[];
  detectedRestrictionViolations: string[];
}

export interface PersonalCompatibilityReport {
  recipeId: string;
  isCompatible: boolean;
  allergenConflicts: IngredientConflict[];
  restrictionConflicts: IngredientConflict[];
  allConflictingIngredients: string[];
  allConflictingAllergens: string[];
  allConflictingRestrictions: string[];
  summary: string;
  languageSupported: boolean;
  detectedLanguage?: string;
}

// Languages we support for allergen detection
const SUPPORTED_LANGUAGES = ['en', 'ar', 'es', 'fr', 'english', 'arabic', 'spanish', 'french'];

@Injectable()
export class RecipeCompatibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly allergenMapping: AllergenMappingService,
  ) {}

  /**
   * Detect language from text using character patterns
   * For bilingual content, prefers supported languages (English) if present
   */
  private detectLanguageFromText(text: string): string | null {
    if (!text) return null;

    // Non-Latin script detection (these are exclusive - can't have English)
    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4E00-\u9FFF]/;
    const japanesePattern = /[\u3040-\u30FF]/;
    const koreanPattern = /[\uAC00-\uD7AF]/;
    const cyrillicPattern = /[\u0400-\u04FF]/;
    const hebrewPattern = /[\u0590-\u05FF]/;
    const thaiPattern = /[\u0E00-\u0E7F]/;
    const greekPattern = /[\u0370-\u03FF]/;

    if (arabicPattern.test(text)) return 'ar';
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'ja';
    if (koreanPattern.test(text)) return 'ko';
    if (cyrillicPattern.test(text)) return 'ru';
    if (hebrewPattern.test(text)) return 'he';
    if (thaiPattern.test(text)) return 'th';
    if (greekPattern.test(text)) return 'el';

    // For Latin-script languages, check if there's significant English content
    // Common English words that indicate English content is present
    const englishIndicators = /\b(the|and|with|for|add|mix|cook|bake|stir|heat|serve|ingredients?|instructions?|minutes?|hours?|cups?|tablespoons?|teaspoons?|grams?|ounces?|pounds?|salt|pepper|sugar|flour|butter|oil|water|milk|eggs?|chicken|beef|pork|fish|vegetables?|onion|garlic|tomato|potato|rice|pasta|sauce|dough|oven|pan|bowl|recipe)\b/i;
    const hasEnglishContent = englishIndicators.test(text);

    // Latin-script languages with unique character patterns
    // Turkish: ğ, ş, ı (dotless i), İ (dotted I)
    const turkishPattern = /[ğĞşŞıİ]/;

    // Polish: ą, ć, ę, ł, ń, ś, ź, ż
    const polishPattern = /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/;

    // Vietnamese: ă, â, đ, ê, ô, ơ, ư
    const vietnamesePattern = /[ăâđêôơưĂÂĐÊÔƠƯ]/;

    // Czech/Slovak: ř, ů, ě, ď, ť, ň
    const czechPattern = /[řůěďťňŘŮĚĎŤŇ]/;

    // Hungarian: ő, ű
    const hungarianPattern = /[őűŐŰ]/;

    // Romanian: ș, ț
    const romanianPattern = /[șțȘȚ]/;

    // Detect the non-English language
    let detectedLang: string | null = null;
    if (turkishPattern.test(text)) detectedLang = 'tr';
    else if (polishPattern.test(text)) detectedLang = 'pl';
    else if (vietnamesePattern.test(text)) detectedLang = 'vi';
    else if (czechPattern.test(text)) detectedLang = 'cs';
    else if (hungarianPattern.test(text)) detectedLang = 'hu';
    else if (romanianPattern.test(text)) detectedLang = 'ro';

    // If we detected an unsupported Latin-script language BUT there's also English content,
    // treat it as English (bilingual recipe with English translation available)
    if (detectedLang && hasEnglishContent) {
      return 'en';
    }

    // Return the detected language or default to English
    return detectedLang || 'en';
  }

  /**
   * Extract text content from recipe for language detection
   */
  private extractRecipeText(title: string, components: RecipeComponent[]): string {
    const texts: string[] = [title];

    for (const component of components) {
      if (component.name) texts.push(component.name);
      if (component.ingredients) {
        for (const ing of component.ingredients) {
          if (ing.name) texts.push(ing.name);
          if (ing.notes) texts.push(ing.notes);
        }
      }
    }

    return texts.join(' ');
  }

  /**
   * Check if a recipe is compatible with a dinner circle
   */
  async checkRecipeCompatibility(
    userId: string,
    recipeId: string,
    circleId: string,
  ): Promise<CompatibilityReport> {
    // Fetch recipe with language info
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
        components: true,
        userId: true,
        languageDetected: true,
        originalLanguage: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Fetch circle with members
    const circle = await this.prisma.dinnerCircle.findFirst({
      where: {
        id: circleId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: true,
      },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found or you do not have access');
    }

    const components = (recipe.components as unknown as RecipeComponent[]) || [];

    // Check language support - detect from content if not stored
    let detectedLanguage = recipe.languageDetected || recipe.originalLanguage || null;

    // If no stored language, detect from recipe content
    if (!detectedLanguage) {
      const recipeText = this.extractRecipeText(recipe.title, components);
      detectedLanguage = this.detectLanguageFromText(recipeText);

      // Optionally update the recipe with detected language for future checks
      if (detectedLanguage) {
        this.prisma.recipe.update({
          where: { id: recipeId },
          data: { languageDetected: detectedLanguage },
        }).catch(() => {}); // Fire and forget, don't block
      }
    }

    const languageSupported = detectedLanguage
      ? SUPPORTED_LANGUAGES.includes(detectedLanguage.toLowerCase())
      : true; // Fallback if detection fails

    // Check if any members have dietary restrictions
    const membersWithRestrictions = circle.members.filter(
      (m) => m.allergens.length > 0 || m.restrictions.length > 0
    );

    // If language not supported and members have restrictions, we can't verify
    if (!languageSupported && membersWithRestrictions.length > 0) {
      return {
        recipeId: recipe.id,
        circleId: circle.id,
        circleName: circle.name,
        isCompatible: false,
        memberConflicts: [],
        allConflictingIngredients: [],
        allConflictingAllergens: [],
        allConflictingRestrictions: [],
        safeForMembers: [],
        summary: `Cannot verify - recipe language (${detectedLanguage}) is not supported for allergen detection`,
        languageSupported: false,
        detectedLanguage: detectedLanguage || undefined,
      };
    }

    const memberConflicts: MemberConflict[] = [];
    const safeMembers: Array<{ memberId: string; memberName: string }> = [];
    const allConflictingIngredients = new Set<string>();
    const allConflictingAllergens = new Set<string>();
    const allConflictingRestrictions = new Set<string>();

    // Check each member
    for (const member of circle.members) {
      const allergenConflicts = this.allergenMapping.checkRecipeForAllergens(
        components,
        member.allergens,
      );
      const restrictionConflicts = this.allergenMapping.checkRecipeForRestrictions(
        components,
        member.restrictions,
      );

      if (allergenConflicts.length > 0 || restrictionConflicts.length > 0) {
        memberConflicts.push({
          memberId: member.id,
          memberName: member.name,
          avatarEmoji: member.avatarEmoji || undefined,
          allergenConflicts,
          restrictionConflicts,
        });

        // Collect all conflicting items
        allergenConflicts.forEach((c) => {
          allConflictingIngredients.add(c.ingredientName);
          c.allergens.forEach((a) => allConflictingAllergens.add(a));
        });
        restrictionConflicts.forEach((c) => {
          allConflictingIngredients.add(c.ingredientName);
          c.allergens.forEach((r) => allConflictingRestrictions.add(r));
        });
      } else {
        safeMembers.push({
          memberId: member.id,
          memberName: member.name,
        });
      }
    }

    const isCompatible = memberConflicts.length === 0;

    // Build summary
    let summary: string;
    if (isCompatible) {
      summary = `Safe for all ${circle.members.length} members of ${circle.name}`;
    } else {
      const affectedNames = memberConflicts.map((m) => m.memberName).join(', ');
      summary = `Contains ingredients that may affect: ${affectedNames}`;
    }

    return {
      recipeId: recipe.id,
      circleId: circle.id,
      circleName: circle.name,
      isCompatible,
      memberConflicts,
      allConflictingIngredients: Array.from(allConflictingIngredients),
      allConflictingAllergens: Array.from(allConflictingAllergens),
      allConflictingRestrictions: Array.from(allConflictingRestrictions),
      safeForMembers: safeMembers,
      summary,
      languageSupported,
      detectedLanguage: detectedLanguage || undefined,
    };
  }

  /**
   * Get recipes compatible with a dinner circle
   */
  async getCompatibleRecipes(
    userId: string,
    circleId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
    } = {},
  ) {
    const { page = 1, limit = 20, search, category } = options;

    // Fetch circle with all member dietary info
    const circle = await this.prisma.dinnerCircle.findFirst({
      where: {
        id: circleId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: true,
      },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found or you do not have access');
    }

    // Aggregate all allergens and restrictions from circle members
    const allAllergens = new Set<string>();
    const allRestrictions = new Set<string>();

    for (const member of circle.members) {
      member.allergens.forEach((a) => allAllergens.add(a.toLowerCase()));
      member.restrictions.forEach((r) => allRestrictions.add(r.toLowerCase()));
    }

    // Build base query
    const where: any = { userId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // Fetch all matching recipes (we need to filter in-memory due to JSON components)
    const allRecipes = await this.prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        nutrition: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    // Filter recipes by compatibility
    const compatibleRecipes = allRecipes.filter((recipe) => {
      const components = (recipe.components as unknown as RecipeComponent[]) || [];

      // Check for allergen conflicts
      const allergenConflicts = this.allergenMapping.checkRecipeForAllergens(
        components,
        Array.from(allAllergens),
      );

      // Check for restriction conflicts
      const restrictionConflicts = this.allergenMapping.checkRecipeForRestrictions(
        components,
        Array.from(allRestrictions),
      );

      return allergenConflicts.length === 0 && restrictionConflicts.length === 0;
    });

    // Paginate results
    const total = compatibleRecipes.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedRecipes = compatibleRecipes.slice(skip, skip + limit);

    return {
      data: paginatedRecipes,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      circleInfo: {
        id: circle.id,
        name: circle.name,
        memberCount: circle.members.length,
      },
    };
  }

  /**
   * Analyze a recipe and detect all allergens/restrictions
   */
  async analyzeRecipe(recipeId: string): Promise<RecipeCompatibilityInfo> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        components: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const components = (recipe.components as unknown as RecipeComponent[]) || [];

    // Detect all allergens
    const detectedAllergens = this.allergenMapping.detectAllAllergensInRecipe(components);

    // Check which restrictions would be violated
    const allRestrictions = this.allergenMapping.getSupportedRestrictions();
    const violatedRestrictions = new Set<string>();

    for (const restriction of allRestrictions) {
      const conflicts = this.allergenMapping.checkRecipeForRestrictions(
        components,
        [restriction],
      );
      if (conflicts.length > 0) {
        violatedRestrictions.add(restriction);
      }
    }

    return {
      recipeId: recipe.id,
      detectedAllergens,
      detectedRestrictionViolations: Array.from(violatedRestrictions),
    };
  }

  /**
   * Quick compatibility check for multiple recipes (for badges)
   */
  async batchCheckCompatibility(
    userId: string,
    recipeIds: string[],
    circleId: string,
  ): Promise<Map<string, boolean>> {
    // Fetch circle dietary info
    const circle = await this.prisma.dinnerCircle.findFirst({
      where: {
        id: circleId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: true,
      },
    });

    if (!circle) {
      return new Map();
    }

    // Aggregate all allergens and restrictions
    const allAllergens = circle.members.flatMap((m) => m.allergens);
    const allRestrictions = circle.members.flatMap((m) => m.restrictions);

    // Fetch recipes
    const recipes = await this.prisma.recipe.findMany({
      where: {
        id: { in: recipeIds },
      },
      select: {
        id: true,
        components: true,
      },
    });

    const results = new Map<string, boolean>();

    for (const recipe of recipes) {
      const components = (recipe.components as unknown as RecipeComponent[]) || [];

      const allergenConflicts = this.allergenMapping.checkRecipeForAllergens(
        components,
        allAllergens,
      );

      const restrictionConflicts = this.allergenMapping.checkRecipeForRestrictions(
        components,
        allRestrictions,
      );

      results.set(
        recipe.id,
        allergenConflicts.length === 0 && restrictionConflicts.length === 0,
      );
    }

    return results;
  }

  /**
   * Check if a recipe is compatible with the current user's personal allergens/restrictions
   */
  async checkPersonalCompatibility(
    userId: string,
    recipeId: string,
  ): Promise<PersonalCompatibilityReport> {
    // Fetch recipe with language info
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
        components: true,
        languageDetected: true,
        originalLanguage: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Fetch user's allergens and dietary restrictions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        allergens: true,
        dietaryRestrictions: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userAllergens = user.allergens.map((a) => a.allergen);
    const userRestrictions = user.dietaryRestrictions.map((r) => r.restriction);

    const components = (recipe.components as unknown as RecipeComponent[]) || [];

    // Determine the recipe's language - detect from content if not stored
    let detectedLanguage = recipe.languageDetected || recipe.originalLanguage || null;

    // If no stored language, detect from recipe content
    if (!detectedLanguage) {
      const recipeText = this.extractRecipeText(recipe.title, components);
      detectedLanguage = this.detectLanguageFromText(recipeText);

      // Optionally update the recipe with detected language for future checks
      if (detectedLanguage) {
        this.prisma.recipe.update({
          where: { id: recipeId },
          data: { languageDetected: detectedLanguage },
        }).catch(() => {}); // Fire and forget, don't block
      }
    }

    const languageSupported = detectedLanguage
      ? SUPPORTED_LANGUAGES.includes(detectedLanguage.toLowerCase())
      : true; // Fallback if detection fails

    // If user has no allergens or restrictions, return compatible
    if (userAllergens.length === 0 && userRestrictions.length === 0) {
      return {
        recipeId: recipe.id,
        isCompatible: true,
        allergenConflicts: [],
        restrictionConflicts: [],
        allConflictingIngredients: [],
        allConflictingAllergens: [],
        allConflictingRestrictions: [],
        summary: 'No dietary preferences set',
        languageSupported: true,
        detectedLanguage: detectedLanguage || undefined,
      };
    }

    // Check for allergen conflicts
    const allergenConflicts = this.allergenMapping.checkRecipeForAllergens(
      components,
      userAllergens,
    );

    // Check for restriction conflicts
    const restrictionConflicts = this.allergenMapping.checkRecipeForRestrictions(
      components,
      userRestrictions,
    );

    const allConflictingIngredients = new Set<string>();
    const allConflictingAllergens = new Set<string>();
    const allConflictingRestrictions = new Set<string>();

    allergenConflicts.forEach((c) => {
      allConflictingIngredients.add(c.ingredientName);
      c.allergens.forEach((a) => allConflictingAllergens.add(a));
    });

    restrictionConflicts.forEach((c) => {
      allConflictingIngredients.add(c.ingredientName);
      c.allergens.forEach((r) => allConflictingRestrictions.add(r));
    });

    const isCompatible = allergenConflicts.length === 0 && restrictionConflicts.length === 0;

    // Build summary
    let summary: string;
    if (!languageSupported) {
      // Language not supported - we can't verify safety
      summary = `Cannot verify - recipe language (${detectedLanguage}) is not supported for allergen detection`;
    } else if (isCompatible) {
      summary = 'This recipe is compatible with your dietary preferences';
    } else {
      const issues: string[] = [];
      if (allConflictingAllergens.size > 0) {
        issues.push(`allergens: ${Array.from(allConflictingAllergens).join(', ')}`);
      }
      if (allConflictingRestrictions.size > 0) {
        issues.push(`restrictions: ${Array.from(allConflictingRestrictions).join(', ')}`);
      }
      summary = `Contains ingredients that conflict with your ${issues.join(' and ')}`;
    }

    return {
      recipeId: recipe.id,
      isCompatible: languageSupported ? isCompatible : false, // Not compatible if we can't verify
      allergenConflicts,
      restrictionConflicts,
      allConflictingIngredients: Array.from(allConflictingIngredients),
      allConflictingAllergens: Array.from(allConflictingAllergens),
      allConflictingRestrictions: Array.from(allConflictingRestrictions),
      summary,
      languageSupported,
      detectedLanguage: detectedLanguage || undefined,
    };
  }
}
