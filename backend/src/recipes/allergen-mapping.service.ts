import { Injectable } from '@nestjs/common';

export interface IngredientConflict {
  ingredientName: string;
  componentName?: string;
  allergens: string[];
  quantity?: string;
  unit?: string;
}

export interface RecipeComponent {
  name: string;
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    optional?: boolean;
  }>;
}

@Injectable()
export class AllergenMappingService {
  // Comprehensive allergen keyword mappings (multilingual: English, Arabic, Spanish, French)
  private static readonly ALLERGEN_KEYWORDS: Record<string, string[]> = {
    // Tree nuts
    'nuts': [
      // English
      'nut', 'almond', 'walnut', 'pecan', 'cashew', 'pistachio',
      'hazelnut', 'macadamia', 'brazil nut', 'chestnut', 'pine nut',
      'praline', 'marzipan', 'nougat', 'gianduja',
      // Arabic
      'مكسرات', 'لوز', 'جوز', 'بيكان', 'كاجو', 'فستق', 'بندق', 'كستناء', 'صنوبر',
      // Spanish
      'nuez', 'almendra', 'nueces', 'anacardo', 'avellana', 'castaña', 'piñón',
      // French
      'noix', 'amande', 'noisette', 'châtaigne', 'pignon',
    ],
    'tree-nuts': [
      'almond', 'walnut', 'pecan', 'cashew', 'pistachio',
      'hazelnut', 'macadamia', 'brazil nut', 'chestnut', 'pine nut',
      'لوز', 'جوز', 'بيكان', 'كاجو', 'فستق', 'بندق',
    ],
    'peanuts': [
      'peanut', 'groundnut', 'arachis',
      'فول سوداني', 'فستق سوداني',
      'cacahuete', 'maní',
      'cacahuète', 'arachide',
    ],

    // Dairy
    'dairy': [
      // English
      'milk', 'cream', 'cheese', 'butter', 'yogurt', 'yoghurt',
      'whey', 'casein', 'lactose', 'ghee', 'paneer', 'ricotta',
      'mozzarella', 'parmesan', 'cheddar', 'brie', 'camembert',
      'feta', 'gouda', 'gruyere', 'mascarpone', 'cottage cheese',
      'sour cream', 'creme fraiche', 'half-and-half', 'buttermilk',
      'condensed milk', 'evaporated milk', 'ice cream', 'gelato',
      'custard', 'pudding', 'whipped cream', 'clotted cream',
      // Arabic
      'حليب', 'لبن', 'جبن', 'جبنة', 'زبدة', 'زبادي', 'قشطة', 'كريمة', 'سمن', 'سمنة',
      'موزاريلا', 'بارميزان', 'شيدر', 'فيتا', 'آيس كريم', 'بوظة', 'مثلجات',
      // Spanish
      'leche', 'crema', 'queso', 'mantequilla', 'yogur', 'nata', 'helado',
      // French
      'lait', 'crème', 'fromage', 'beurre', 'yaourt', 'glace',
    ],

    // Eggs
    'eggs': [
      // English
      'egg', 'mayonnaise', 'mayo', 'meringue', 'aioli',
      'hollandaise', 'bearnaise', 'custard', 'quiche',
      'albumin', 'globulin', 'lysozyme', 'ovalbumin',
      // Arabic
      'بيض', 'بيضة', 'مايونيز',
      // Spanish
      'huevo', 'huevos', 'mayonesa',
      // French
      'oeuf', 'oeufs', 'œuf', 'œufs', 'mayonnaise',
    ],

    // Seafood
    'shellfish': [
      // English
      'shrimp', 'prawn', 'crab', 'lobster', 'crawfish', 'crayfish',
      'scallop', 'clam', 'mussel', 'oyster', 'squid', 'calamari',
      'octopus', 'snail', 'escargot', 'abalone', 'conch',
      'langoustine', 'cuttlefish',
      // Arabic
      'جمبري', 'روبيان', 'قريدس', 'كابوريا', 'سرطان البحر', 'كركند', 'استاكوزا',
      'محار', 'بلح البحر', 'حبار', 'كاليماري', 'أخطبوط',
      // Spanish
      'camarón', 'gamba', 'cangrejo', 'langosta', 'almeja', 'mejillón', 'ostra', 'calamar', 'pulpo',
      // French
      'crevette', 'crabe', 'homard', 'moule', 'huître', 'calmar', 'poulpe',
    ],
    'fish': [
      // English
      'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'anchovy',
      'sardine', 'trout', 'bass', 'halibut', 'mackerel', 'herring',
      'snapper', 'grouper', 'catfish', 'perch', 'pike', 'sole',
      'flounder', 'swordfish', 'mahi', 'haddock', 'pollock',
      'fish sauce', 'worcestershire', 'caesar dressing',
      // Arabic
      'سمك', 'سمكة', 'سلمون', 'تونة', 'سردين', 'أنشوجة', 'قد', 'بلطي', 'هامور',
      // Spanish
      'pescado', 'salmón', 'atún', 'bacalao', 'sardina', 'trucha', 'anchoa',
      // French
      'poisson', 'saumon', 'thon', 'morue', 'sardine', 'truite', 'anchois',
    ],

    // Soy
    'soy': [
      // English
      'soy', 'soya', 'tofu', 'edamame', 'tempeh', 'miso',
      'soy sauce', 'tamari', 'shoyu', 'teriyaki', 'natto',
      'soy milk', 'soy protein', 'textured vegetable protein', 'tvp',
      // Arabic
      'صويا', 'فول الصويا', 'توفو', 'صلصة الصويا', 'حليب الصويا',
      // Spanish
      'soja', 'salsa de soja', 'leche de soja',
      // French
      'soja', 'sauce soja', 'lait de soja',
    ],

    // Wheat/Gluten
    'wheat': [
      // English
      'wheat', 'flour', 'bread', 'pasta', 'noodle', 'couscous',
      'semolina', 'bulgur', 'farro', 'spelt', 'kamut', 'durum',
      'seitan', 'cracker', 'breadcrumb', 'panko', 'pita',
      'tortilla', 'croissant', 'baguette', 'ciabatta', 'focaccia',
      // Arabic
      'قمح', 'طحين', 'دقيق', 'خبز', 'عيش', 'معكرونة', 'باستا', 'مكرونة',
      'نودلز', 'شعيرية', 'كسكس', 'برغل', 'سميد', 'بيتا', 'خبز عربي',
      'كرواسون', 'باجيت',
      // Spanish
      'trigo', 'harina', 'pan', 'pasta', 'fideos', 'cuscús', 'sémola',
      // French
      'blé', 'farine', 'pain', 'pâtes', 'nouilles', 'semoule',
    ],
    'gluten': [
      // English
      'wheat', 'barley', 'rye', 'flour', 'bread', 'pasta',
      'seitan', 'malt', 'beer', 'ale', 'lager', 'couscous',
      'bulgur', 'farro', 'spelt', 'kamut', 'triticale',
      'semolina', 'durum', 'einkorn', 'emmer',
      // Arabic
      'قمح', 'شعير', 'جاودار', 'طحين', 'دقيق', 'خبز', 'عيش', 'معكرونة',
      'باستا', 'مكرونة', 'شعيرية', 'كسكس', 'برغل', 'سميد', 'بيرة', 'جعة',
      // Spanish
      'trigo', 'cebada', 'centeno', 'harina', 'pan', 'pasta', 'cerveza', 'malta',
      // French
      'blé', 'orge', 'seigle', 'farine', 'pain', 'pâtes', 'bière', 'malt',
    ],

    // Sesame
    'sesame': [
      // English
      'sesame', 'tahini', 'halvah', 'halva', 'hummus',
      'sesame oil', 'sesame seed', 'goma', 'til',
      // Arabic
      'سمسم', 'طحينة', 'طحينية', 'حلاوة', 'حمص', 'زيت السمسم',
      // Spanish
      'sésamo', 'ajonjolí', 'tahini', 'hummus',
      // French
      'sésame', 'tahini', 'houmous',
    ],

    // Other common allergens
    'mustard': [
      'mustard', 'dijon', 'yellow mustard', 'mustard seed',
      'mustard powder', 'mustard oil',
      'خردل', 'مستردة',
      'mostaza',
      'moutarde',
    ],
    'celery': [
      'celery', 'celeriac', 'celery salt', 'celery seed',
      'كرفس',
      'apio',
      'céleri',
    ],
    'lupin': [
      'lupin', 'lupine', 'lupini',
      'ترمس',
      'altramuz', 'lupino',
      'lupin',
    ],
    'mollusks': [
      'snail', 'escargot', 'squid', 'calamari', 'octopus',
      'clam', 'mussel', 'oyster', 'scallop', 'abalone',
      'حلزون', 'حبار', 'أخطبوط', 'محار',
      'caracol', 'calamar', 'pulpo', 'almeja', 'mejillón', 'ostra',
      'escargot', 'calmar', 'poulpe', 'moule', 'huître',
    ],
    'sulfites': [
      'sulfite', 'sulphite', 'sulfur dioxide', 'wine', 'dried fruit',
      'كبريتيت', 'نبيذ', 'فواكه مجففة',
      'sulfito', 'vino',
      'sulfite', 'vin',
    ],
  };

  // Dietary restriction keywords (multilingual)
  private static readonly RESTRICTION_KEYWORDS: Record<string, string[]> = {
    'gluten-free': [
      // English
      'wheat', 'barley', 'rye', 'flour', 'bread', 'pasta',
      'seitan', 'malt', 'beer', 'ale', 'lager', 'couscous',
      'bulgur', 'farro', 'spelt', 'kamut', 'triticale',
      'semolina', 'durum', 'einkorn', 'emmer', 'noodle',
      'cracker', 'breadcrumb', 'panko', 'pita', 'tortilla',
      'croissant', 'baguette', 'ciabatta', 'focaccia',
      // Arabic
      'قمح', 'شعير', 'جاودار', 'طحين', 'دقيق', 'خبز', 'عيش', 'معكرونة',
      'باستا', 'مكرونة', 'شعيرية', 'كسكس', 'برغل', 'سميد', 'بيرة', 'جعة',
      'نودلز', 'بيتا', 'خبز عربي', 'كرواسون', 'باجيت',
      // Spanish
      'trigo', 'cebada', 'centeno', 'harina', 'pan', 'pasta', 'cerveza', 'malta', 'fideos',
      // French
      'blé', 'orge', 'seigle', 'farine', 'pain', 'pâtes', 'bière', 'malt', 'nouilles',
    ],
    'gluten free': [
      // Same as gluten-free
      'wheat', 'barley', 'rye', 'flour', 'bread', 'pasta',
      'seitan', 'malt', 'beer', 'ale', 'lager', 'couscous',
      'bulgur', 'farro', 'spelt', 'kamut', 'triticale',
      'semolina', 'durum', 'einkorn', 'emmer', 'noodle',
      'cracker', 'breadcrumb', 'panko', 'pita', 'tortilla',
      'croissant', 'baguette', 'ciabatta', 'focaccia',
      'قمح', 'شعير', 'جاودار', 'طحين', 'دقيق', 'خبز', 'عيش', 'معكرونة',
      'باستا', 'مكرونة', 'شعيرية', 'كسكس', 'برغل', 'سميد', 'بيرة', 'جعة',
      'نودلز', 'بيتا', 'خبز عربي', 'كرواسون', 'باجيت',
      'trigo', 'cebada', 'centeno', 'harina', 'pan', 'pasta', 'cerveza', 'malta', 'fideos',
      'blé', 'orge', 'seigle', 'farine', 'pain', 'pâtes', 'bière', 'malt', 'nouilles',
    ],
    'vegetarian': [
      // English
      'meat', 'beef', 'pork', 'chicken', 'turkey', 'duck', 'lamb',
      'veal', 'bacon', 'ham', 'sausage', 'salami', 'pepperoni',
      'prosciutto', 'pancetta', 'chorizo', 'hot dog', 'meatball',
      'ground beef', 'ground pork', 'steak', 'rib', 'roast',
      'brisket', 'tenderloin', 'sirloin', 'filet', 'chop',
      'gelatin', 'lard', 'tallow', 'suet', 'bone broth',
      // Arabic
      'لحم', 'لحمة', 'بقر', 'دجاج', 'فراخ', 'ديك رومي', 'بط', 'خروف', 'ضأن',
      'عجل', 'لحم بقري', 'لحم خنزير', 'خنزير', 'بيكون', 'لانشون', 'سجق', 'نقانق',
      'سلامي', 'هوت دوج', 'كفتة', 'ستيك', 'ريش', 'شرائح لحم', 'جيلاتين', 'شحم',
      // Spanish
      'carne', 'res', 'cerdo', 'pollo', 'pavo', 'pato', 'cordero',
      'ternera', 'tocino', 'jamón', 'salchicha', 'chorizo', 'gelatina',
      // French
      'viande', 'boeuf', 'porc', 'poulet', 'dinde', 'canard', 'agneau',
      'veau', 'bacon', 'jambon', 'saucisse', 'gélatine',
    ],
    'vegan': [
      // English
      'meat', 'beef', 'pork', 'chicken', 'turkey', 'duck', 'lamb',
      'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster',
      'egg', 'milk', 'cream', 'cheese', 'butter', 'yogurt',
      'honey', 'gelatin', 'lard', 'whey', 'casein', 'ghee',
      'anchovies', 'worcestershire', 'oyster sauce',
      // Arabic
      'لحم', 'لحمة', 'دجاج', 'سمك', 'جمبري', 'بيض', 'حليب', 'لبن',
      'جبن', 'جبنة', 'زبدة', 'زبادي', 'عسل', 'جيلاتين', 'سمن', 'قشطة',
      // Spanish
      'carne', 'pollo', 'pescado', 'huevo', 'leche', 'queso', 'mantequilla',
      'yogur', 'miel', 'gelatina',
      // French
      'viande', 'poulet', 'poisson', 'oeuf', 'lait', 'fromage', 'beurre',
      'yaourt', 'miel', 'gélatine',
    ],
    'pescatarian': [
      // English
      'meat', 'beef', 'pork', 'chicken', 'turkey', 'duck', 'lamb',
      'veal', 'bacon', 'ham', 'sausage', 'salami', 'pepperoni',
      'prosciutto', 'pancetta', 'chorizo',
      // Arabic
      'لحم', 'لحمة', 'بقر', 'دجاج', 'فراخ', 'ديك رومي', 'بط', 'خروف',
      'بيكون', 'سجق', 'سلامي',
      // Spanish
      'carne', 'res', 'cerdo', 'pollo', 'pavo', 'cordero', 'tocino', 'jamón',
      // French
      'viande', 'boeuf', 'porc', 'poulet', 'dinde', 'agneau', 'bacon', 'jambon',
    ],
    'halal': [
      // English
      'pork', 'bacon', 'ham', 'lard', 'pepperoni', 'salami',
      'prosciutto', 'pancetta', 'gelatin', 'wine', 'beer',
      'alcohol', 'rum', 'brandy', 'whiskey', 'vodka',
      // Arabic
      'خنزير', 'لحم خنزير', 'بيكون', 'شحم خنزير', 'جيلاتين', 'نبيذ', 'بيرة',
      'كحول', 'رم', 'براندي', 'ويسكي', 'فودكا',
      // Spanish
      'cerdo', 'tocino', 'jamón', 'manteca', 'gelatina', 'vino', 'cerveza', 'alcohol',
      // French
      'porc', 'bacon', 'jambon', 'saindoux', 'gélatine', 'vin', 'bière', 'alcool',
    ],
    'kosher': [
      // English
      'pork', 'bacon', 'ham', 'shellfish', 'shrimp', 'crab',
      'lobster', 'clam', 'oyster', 'mussel', 'scallop',
      // Arabic
      'خنزير', 'بيكون', 'جمبري', 'سرطان البحر', 'كركند', 'محار',
      // Spanish
      'cerdo', 'tocino', 'jamón', 'mariscos', 'camarón', 'cangrejo', 'langosta',
      // French
      'porc', 'bacon', 'jambon', 'fruits de mer', 'crevette', 'crabe', 'homard',
    ],
  };

  /**
   * Check if a keyword matches in text, handling both Latin and non-Latin scripts
   * For Latin text: uses word boundary matching
   * For non-Latin text: uses direct contains check (Arabic, etc.)
   */
  private keywordMatchesInText(keyword: string, text: string): boolean {
    const normalizedKeyword = keyword.toLowerCase().trim();
    const normalizedText = text.toLowerCase().trim();

    // Check if keyword contains non-Latin characters (Arabic, Chinese, etc.)
    const hasNonLatin = /[^\u0000-\u007F]/.test(normalizedKeyword);

    if (hasNonLatin) {
      // For non-Latin scripts, use direct contains check
      // This handles Arabic, Chinese, Japanese, Korean, etc.
      return normalizedText.includes(normalizedKeyword);
    } else {
      // For Latin text, use word boundary matching
      const regex = new RegExp(`\\b${this.escapeRegex(normalizedKeyword)}\\b`, 'i');
      return regex.test(normalizedText);
    }
  }

  /**
   * Find all allergens present in an ingredient name
   */
  findAllergensInIngredient(ingredientName: string): string[] {
    const foundAllergens = new Set<string>();

    for (const [allergen, keywords] of Object.entries(
      AllergenMappingService.ALLERGEN_KEYWORDS,
    )) {
      for (const keyword of keywords) {
        if (this.keywordMatchesInText(keyword, ingredientName)) {
          foundAllergens.add(allergen);
          break;
        }
      }
    }

    return Array.from(foundAllergens);
  }

  /**
   * Find dietary restrictions violated by an ingredient
   */
  findRestrictionsViolated(ingredientName: string): string[] {
    const violatedRestrictions = new Set<string>();

    for (const [restriction, keywords] of Object.entries(
      AllergenMappingService.RESTRICTION_KEYWORDS,
    )) {
      for (const keyword of keywords) {
        if (this.keywordMatchesInText(keyword, ingredientName)) {
          violatedRestrictions.add(restriction);
          break;
        }
      }
    }

    return Array.from(violatedRestrictions);
  }

  /**
   * Check a recipe's components for allergen conflicts
   */
  checkRecipeForAllergens(
    components: RecipeComponent[],
    memberAllergens: string[],
  ): IngredientConflict[] {
    const conflicts: IngredientConflict[] = [];
    const normalizedMemberAllergens = memberAllergens.map((a) =>
      a.toLowerCase().trim(),
    );

    for (const component of components) {
      for (const ingredient of component.ingredients) {
        const ingredientAllergens = this.findAllergensInIngredient(
          ingredient.name,
        );
        const matchingAllergens = ingredientAllergens.filter((a) =>
          normalizedMemberAllergens.includes(a.toLowerCase()),
        );

        if (matchingAllergens.length > 0) {
          conflicts.push({
            ingredientName: ingredient.name,
            componentName: component.name,
            allergens: matchingAllergens,
            quantity: ingredient.quantity?.toString(),
            unit: ingredient.unit,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check a recipe's components for dietary restriction violations
   */
  checkRecipeForRestrictions(
    components: RecipeComponent[],
    memberRestrictions: string[],
  ): IngredientConflict[] {
    const conflicts: IngredientConflict[] = [];
    const normalizedRestrictions = memberRestrictions.map((r) =>
      r.toLowerCase().trim(),
    );

    for (const component of components) {
      for (const ingredient of component.ingredients) {
        const violatedRestrictions = this.findRestrictionsViolated(
          ingredient.name,
        );
        const matchingViolations = violatedRestrictions.filter((r) =>
          normalizedRestrictions.includes(r.toLowerCase()),
        );

        if (matchingViolations.length > 0) {
          conflicts.push({
            ingredientName: ingredient.name,
            componentName: component.name,
            allergens: matchingViolations, // reusing allergens field for restrictions
            quantity: ingredient.quantity?.toString(),
            unit: ingredient.unit,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Get all detectable allergens from a recipe
   */
  detectAllAllergensInRecipe(components: RecipeComponent[]): string[] {
    const allAllergens = new Set<string>();

    for (const component of components) {
      for (const ingredient of component.ingredients) {
        const allergens = this.findAllergensInIngredient(ingredient.name);
        allergens.forEach((a) => allAllergens.add(a));
      }
    }

    return Array.from(allAllergens);
  }

  /**
   * Get list of all supported allergens
   */
  getSupportedAllergens(): string[] {
    return Object.keys(AllergenMappingService.ALLERGEN_KEYWORDS);
  }

  /**
   * Get list of all supported dietary restrictions
   */
  getSupportedRestrictions(): string[] {
    return Object.keys(AllergenMappingService.RESTRICTION_KEYWORDS);
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
