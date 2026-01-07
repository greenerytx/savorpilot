// Unit Conversion Utility for GramGrab
// Converts between metric and imperial measurement systems

import type { Ingredient } from '../types/recipe';
import {
  findIngredientDensity,
  shouldConvertToWeight,
  cupsToGrams,
  type IngredientDensity,
} from './ingredientDensity';

export type UnitSystem = 'metric' | 'imperial';
export type UnitCategory = 'volume' | 'weight' | 'temperature' | 'count' | 'other';

interface UnitDefinition {
  category: UnitCategory;
  toBase: number; // Conversion factor to base unit (ml for volume, g for weight)
  system: UnitSystem;
  aliases: string[];
}

// Base units: ml for volume, g for weight
// All conversion factors are relative to base
const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // Volume - Imperial
  cup: {
    category: 'volume',
    toBase: 236.588,
    system: 'imperial',
    aliases: ['cups', 'c'],
  },
  tbsp: {
    category: 'volume',
    toBase: 14.787,
    system: 'imperial',
    aliases: ['tablespoon', 'tablespoons', 'tbs', 'T'],
  },
  tsp: {
    category: 'volume',
    toBase: 4.929,
    system: 'imperial',
    aliases: ['teaspoon', 'teaspoons', 't'],
  },
  'fl oz': {
    category: 'volume',
    toBase: 29.574,
    system: 'imperial',
    aliases: ['fluid ounce', 'fluid ounces', 'fl. oz.', 'fl.oz.', 'floz'],
  },
  qt: {
    category: 'volume',
    toBase: 946.353,
    system: 'imperial',
    aliases: ['quart', 'quarts'],
  },
  pt: {
    category: 'volume',
    toBase: 473.176,
    system: 'imperial',
    aliases: ['pint', 'pints'],
  },
  gal: {
    category: 'volume',
    toBase: 3785.41,
    system: 'imperial',
    aliases: ['gallon', 'gallons'],
  },

  // Volume - Metric
  ml: {
    category: 'volume',
    toBase: 1,
    system: 'metric',
    aliases: ['milliliter', 'milliliters', 'mL', 'millilitre', 'millilitres'],
  },
  L: {
    category: 'volume',
    toBase: 1000,
    system: 'metric',
    aliases: ['l', 'liter', 'liters', 'litre', 'litres'],
  },
  dl: {
    category: 'volume',
    toBase: 100,
    system: 'metric',
    aliases: ['deciliter', 'deciliters', 'decilitre', 'decilitres'],
  },

  // Weight - Imperial
  lb: {
    category: 'weight',
    toBase: 453.592,
    system: 'imperial',
    aliases: ['lbs', 'pound', 'pounds'],
  },
  oz: {
    category: 'weight',
    toBase: 28.3495,
    system: 'imperial',
    aliases: ['ounce', 'ounces'],
  },

  // Weight - Metric
  g: {
    category: 'weight',
    toBase: 1,
    system: 'metric',
    aliases: ['gram', 'grams'],
  },
  kg: {
    category: 'weight',
    toBase: 1000,
    system: 'metric',
    aliases: ['kilogram', 'kilograms'],
  },
  mg: {
    category: 'weight',
    toBase: 0.001,
    system: 'metric',
    aliases: ['milligram', 'milligrams'],
  },
};

// Preferred display units for each system and category
const PREFERRED_UNITS: Record<UnitSystem, Record<'volume' | 'weight', { small: string; medium: string; large: string }>> = {
  metric: {
    volume: { small: 'ml', medium: 'ml', large: 'L' },
    weight: { small: 'g', medium: 'g', large: 'kg' },
  },
  imperial: {
    volume: { small: 'tsp', medium: 'cup', large: 'qt' },
    weight: { small: 'oz', medium: 'oz', large: 'lb' },
  },
};

// Thresholds for unit upgrading (in base units)
const UPGRADE_THRESHOLDS = {
  volume: {
    metric: { toLarge: 750 }, // 750ml -> use L
    imperial: { toMedium: 15, toLarge: 946 }, // 15ml -> cups, 946ml -> qt
  },
  weight: {
    metric: { toLarge: 750 }, // 750g -> use kg
    imperial: { toLarge: 453 }, // 453g (1lb) -> use lb
  },
};

// Build a lookup map for quick unit normalization
const unitAliasMap = new Map<string, string>();
for (const [canonical, def] of Object.entries(UNIT_DEFINITIONS)) {
  unitAliasMap.set(canonical.toLowerCase(), canonical);
  for (const alias of def.aliases) {
    unitAliasMap.set(alias.toLowerCase(), canonical);
  }
}

/**
 * Normalize a unit string to its canonical form
 * @returns Canonical unit name or null if not recognized
 */
export function normalizeUnit(unit: string): string | null {
  if (!unit) return null;
  const normalized = unit.trim().toLowerCase();
  return unitAliasMap.get(normalized) || null;
}

/**
 * Get the category of a unit
 */
export function getUnitCategory(unit: string): UnitCategory {
  const canonical = normalizeUnit(unit);
  if (!canonical) return 'other';
  return UNIT_DEFINITIONS[canonical]?.category || 'other';
}

/**
 * Check if a unit can be converted
 */
export function canConvert(unit: string): boolean {
  const canonical = normalizeUnit(unit);
  if (!canonical) return false;
  const category = UNIT_DEFINITIONS[canonical]?.category;
  return category === 'volume' || category === 'weight';
}

/**
 * Get the system (metric/imperial) of a unit
 */
export function getUnitSystem(unit: string): UnitSystem | null {
  const canonical = normalizeUnit(unit);
  if (!canonical) return null;
  return UNIT_DEFINITIONS[canonical]?.system || null;
}

/**
 * Convert a quantity from one unit to the target system
 */
export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toSystem: UnitSystem
): { quantity: number; unit: string } {
  const canonical = normalizeUnit(fromUnit);

  // If we can't recognize the unit, return as-is
  if (!canonical || !UNIT_DEFINITIONS[canonical]) {
    return { quantity, unit: fromUnit };
  }

  const def = UNIT_DEFINITIONS[canonical];

  // If it's not volume or weight, return as-is
  if (def.category !== 'volume' && def.category !== 'weight') {
    return { quantity, unit: fromUnit };
  }

  // If already in target system, return as-is
  if (def.system === toSystem) {
    return { quantity, unit: canonical };
  }

  // Convert to base units
  const baseValue = quantity * def.toBase;

  // Select appropriate target unit based on quantity
  const targetUnit = selectTargetUnit(baseValue, def.category, toSystem);
  const targetDef = UNIT_DEFINITIONS[targetUnit];

  // Convert from base to target unit
  const convertedQuantity = baseValue / targetDef.toBase;

  return {
    quantity: convertedQuantity,
    unit: targetUnit,
  };
}

/**
 * Convert a quantity with ingredient-aware logic
 * - Dry ingredients: cups/tbsp → grams (using density database)
 * - Wet ingredients: cups/tbsp → ml
 * - Weight units: convert normally
 */
export function convertQuantityWithIngredient(
  quantity: number,
  fromUnit: string,
  toSystem: UnitSystem,
  ingredientName?: string
): { quantity: number; unit: string } {
  const canonical = normalizeUnit(fromUnit);

  // If we can't recognize the unit, return as-is
  if (!canonical || !UNIT_DEFINITIONS[canonical]) {
    return { quantity, unit: fromUnit };
  }

  const def = UNIT_DEFINITIONS[canonical];

  // If it's not volume or weight, return as-is
  if (def.category !== 'volume' && def.category !== 'weight') {
    return { quantity, unit: fromUnit };
  }

  // If already in target system and not volume (no ingredient conversion needed)
  if (def.system === toSystem && def.category !== 'volume') {
    return { quantity, unit: canonical };
  }

  // For weight units, use standard conversion
  if (def.category === 'weight') {
    return convertQuantity(quantity, fromUnit, toSystem);
  }

  // For volume units, apply ingredient-aware conversion
  if (def.category === 'volume' && toSystem === 'metric') {
    // Check if this ingredient should be converted to weight (grams) or volume (ml)
    const convertToWeight = ingredientName
      ? shouldConvertToWeight(ingredientName)
      : false;

    if (convertToWeight && ingredientName) {
      // Convert to cups first, then use density database
      const cupsValue = quantity * def.toBase / 236.588; // Convert to cups
      const gramsValue = cupsToGrams(cupsValue, ingredientName);

      if (gramsValue !== null) {
        // Select appropriate weight unit (g or kg)
        const targetUnit = gramsValue >= 750 ? 'kg' : 'g';
        const displayValue = targetUnit === 'kg' ? gramsValue / 1000 : gramsValue;

        return {
          quantity: displayValue,
          unit: targetUnit,
        };
      }
    }

    // Wet ingredient or no density data - convert to ml/L
    const mlValue = quantity * def.toBase;
    const targetUnit = mlValue >= 750 ? 'L' : 'ml';
    const displayValue = targetUnit === 'L' ? mlValue / 1000 : mlValue;

    return {
      quantity: displayValue,
      unit: targetUnit,
    };
  }

  // For imperial target, convert volume to volume and weight to weight
  if (toSystem === 'imperial') {
    return convertQuantity(quantity, fromUnit, toSystem);
  }

  return { quantity, unit: fromUnit };
}

/**
 * Select the most appropriate unit for a given base value
 */
function selectTargetUnit(
  baseValue: number,
  category: 'volume' | 'weight',
  system: UnitSystem
): string {
  const thresholds = UPGRADE_THRESHOLDS[category][system];
  const preferred = PREFERRED_UNITS[system][category];

  if ('toLarge' in thresholds && baseValue >= thresholds.toLarge) {
    return preferred.large;
  }
  if ('toMedium' in thresholds && baseValue >= thresholds.toMedium) {
    return preferred.medium;
  }
  return preferred.small;
}

/**
 * Format a quantity for display
 * Handles fractions and appropriate decimal places
 */
export function formatQuantity(quantity: number, precision?: number): string {
  if (quantity === 0) return '0';

  // Check for common fractions
  const fraction = toFraction(quantity);
  if (fraction) return fraction;

  // For very small numbers, show more precision
  if (quantity < 0.1) {
    return quantity.toFixed(precision ?? 2);
  }

  // For numbers less than 10, show 1 decimal if needed
  if (quantity < 10) {
    const rounded = Math.round(quantity * 10) / 10;
    if (rounded === Math.floor(rounded)) {
      return rounded.toString();
    }
    return rounded.toFixed(precision ?? 1);
  }

  // For larger numbers, round to whole or 1 decimal
  const rounded = Math.round(quantity * 10) / 10;
  if (rounded === Math.floor(rounded)) {
    return rounded.toString();
  }
  return rounded.toFixed(precision ?? 1);
}

/**
 * Convert decimal to common fraction if it matches
 */
function toFraction(value: number): string | null {
  const tolerance = 0.01;
  const wholePart = Math.floor(value);
  const fractionalPart = value - wholePart;

  const fractions: [number, string][] = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.333, '1/3'],
    [0.375, '3/8'],
    [0.5, '1/2'],
    [0.625, '5/8'],
    [0.666, '2/3'],
    [0.75, '3/4'],
    [0.875, '7/8'],
  ];

  for (const [decimal, fraction] of fractions) {
    if (Math.abs(fractionalPart - decimal) < tolerance) {
      if (wholePart === 0) {
        return fraction;
      }
      return `${wholePart} ${fraction}`;
    }
  }

  // Check if it's essentially a whole number
  if (fractionalPart < tolerance || fractionalPart > 1 - tolerance) {
    return Math.round(value).toString();
  }

  return null;
}

/**
 * Convert an ingredient to the target unit system
 */
export function convertIngredient(
  ingredient: Ingredient,
  toSystem: UnitSystem
): Ingredient {
  if (!ingredient.quantity || !ingredient.unit) {
    return ingredient;
  }

  if (!canConvert(ingredient.unit)) {
    return ingredient;
  }

  const converted = convertQuantity(ingredient.quantity, ingredient.unit, toSystem);

  return {
    ...ingredient,
    quantity: converted.quantity,
    unit: converted.unit,
  };
}

/**
 * Format an ingredient for display with optional conversion
 * @param ingredient The ingredient to format
 * @param displaySystem The system to display in ('original' keeps as-is)
 * @param servingMultiplier Optional multiplier for serving adjustment
 */
export function formatIngredientDisplay(
  ingredient: Ingredient,
  displaySystem: UnitSystem | 'original',
  servingMultiplier: number = 1
): { quantityDisplay: string; unit: string; name: string; originalDisplay?: string } {
  let qty = ingredient.quantity;
  let unit = ingredient.unit || '';
  let originalDisplay: string | undefined;

  // Apply serving multiplier
  if (qty !== undefined) {
    qty = qty * servingMultiplier;
  }

  // Store original for tooltip if converting
  if (displaySystem !== 'original' && qty !== undefined && unit && canConvert(unit)) {
    originalDisplay = `${formatQuantity(qty)} ${unit}`;

    // Use ingredient-aware conversion (dry→grams, wet→ml)
    const converted = convertQuantityWithIngredient(qty, unit, displaySystem, ingredient.name);
    qty = converted.quantity;
    unit = converted.unit;
  }

  return {
    quantityDisplay: qty !== undefined ? formatQuantity(qty) : '',
    unit,
    name: ingredient.name,
    originalDisplay,
  };
}

/**
 * Convert quantity to base units (ml or g) for aggregation
 */
export function toBaseUnits(quantity: number, unit: string): { value: number; category: 'volume' | 'weight' } | null {
  const canonical = normalizeUnit(unit);
  if (!canonical) return null;

  const def = UNIT_DEFINITIONS[canonical];
  if (!def || (def.category !== 'volume' && def.category !== 'weight')) {
    return null;
  }

  return {
    value: quantity * def.toBase,
    category: def.category,
  };
}

/**
 * Convert from base units to the preferred display unit
 */
export function fromBaseUnits(
  baseValue: number,
  category: 'volume' | 'weight',
  toSystem: UnitSystem
): { quantity: number; unit: string } {
  const targetUnit = selectTargetUnit(baseValue, category, toSystem);
  const targetDef = UNIT_DEFINITIONS[targetUnit];

  return {
    quantity: baseValue / targetDef.toBase,
    unit: targetUnit,
  };
}

// Temperature conversion (optional feature)
export function convertTemperature(
  value: number,
  fromUnit: 'C' | 'F',
  toUnit: 'C' | 'F'
): number {
  if (fromUnit === toUnit) return value;

  if (fromUnit === 'F' && toUnit === 'C') {
    return (value - 32) * (5 / 9);
  }
  // C to F
  return value * (9 / 5) + 32;
}

/**
 * Detect temperature mentions in text (for step instructions)
 */
export function detectTemperaturesInText(
  text: string
): Array<{ value: number; unit: 'C' | 'F'; match: string; index: number }> {
  const results: Array<{ value: number; unit: 'C' | 'F'; match: string; index: number }> = [];

  // Patterns: 350F, 350°F, 350 F, 350 degrees F, 180C, 180°C, etc.
  const patterns = [
    /(\d+)\s*°?\s*([CF])\b/gi,
    /(\d+)\s*degrees?\s*([CF])/gi,
    /(\d+)\s*°\s*([CF])/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toUpperCase() as 'C' | 'F';

      // Avoid duplicates
      const isDuplicate = results.some(
        (r) => r.index === match!.index || (r.value === value && r.unit === unit)
      );

      if (!isDuplicate) {
        results.push({
          value,
          unit,
          match: match[0],
          index: match.index,
        });
      }
    }
  }

  return results;
}
