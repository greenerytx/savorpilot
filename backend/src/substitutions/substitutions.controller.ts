import { Controller, Get, Param, Query } from '@nestjs/common';
import { SubstitutionsService } from './substitutions.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('substitutions')
export class SubstitutionsController {
  constructor(private readonly substitutionsService: SubstitutionsService) {}

  /**
   * Get all available ingredients with substitutes
   */
  @Public()
  @Get('ingredients')
  getAllIngredients() {
    return {
      ingredients: this.substitutionsService.getAllIngredients(),
    };
  }

  /**
   * Search for ingredients by name
   */
  @Public()
  @Get('search')
  searchIngredients(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      return { results: [] };
    }
    return {
      results: this.substitutionsService.searchIngredients(query),
    };
  }

  /**
   * Get substitutes for dietary restrictions
   */
  @Public()
  @Get('dietary/:type')
  getDietarySubstitutes(
    @Param('type')
    type:
      | 'vegan'
      | 'vegetarian'
      | 'gluten-free'
      | 'dairy-free'
      | 'egg-free'
      | 'nut-free',
  ) {
    const validTypes = [
      'vegan',
      'vegetarian',
      'gluten-free',
      'dairy-free',
      'egg-free',
      'nut-free',
    ];
    if (!validTypes.includes(type)) {
      return {
        error: `Invalid dietary type. Valid types: ${validTypes.join(', ')}`,
        substitutes: {},
      };
    }
    return {
      dietaryType: type,
      substitutes: this.substitutionsService.getDietarySubstitutes(type),
    };
  }

  /**
   * Get substitutes for a specific ingredient
   */
  @Public()
  @Get(':ingredient')
  getSubstitutes(@Param('ingredient') ingredient: string) {
    const substitutes = this.substitutionsService.getSubstitutes(ingredient);
    if (!substitutes) {
      return {
        ingredient,
        found: false,
        substitutes: [],
        suggestions: this.substitutionsService.searchIngredients(ingredient),
      };
    }
    return {
      ingredient,
      found: true,
      substitutes,
    };
  }

  /**
   * Calculate substitution amount
   */
  @Public()
  @Get(':ingredient/calculate')
  calculateSubstitution(
    @Param('ingredient') ingredient: string,
    @Query('substitute') substitute: string,
    @Query('amount') amount: string,
    @Query('unit') unit: string,
  ) {
    if (!substitute || !amount || !unit) {
      return {
        error: 'Missing required query parameters: substitute, amount, unit',
      };
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return {
        error: 'Amount must be a positive number',
      };
    }

    const result = this.substitutionsService.calculateSubstitution(
      ingredient,
      substitute,
      parsedAmount,
      unit,
    );

    if (!result) {
      return {
        error: `No substitution found for "${substitute}" as replacement for "${ingredient}"`,
      };
    }

    return {
      original: { ingredient, amount: parsedAmount, unit },
      substitution: {
        ingredient: substitute,
        amount: result.amount,
        unit: result.unit,
        notes: result.notes,
      },
    };
  }
}
