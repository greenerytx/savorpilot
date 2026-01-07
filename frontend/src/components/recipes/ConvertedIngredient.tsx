import { cn } from '../../lib/utils';
import type { Ingredient } from '../../types/recipe';
import type { UnitDisplaySystem } from '../../stores/unitPreferencesStore';
import { formatIngredientDisplay } from '../../utils/unitConversion';

export interface ConvertedIngredientProps {
  ingredient: Ingredient;
  displaySystem: UnitDisplaySystem;
  servingMultiplier?: number;
  showOriginalTooltip?: boolean;
  className?: string;
  isChecked?: boolean;
  onToggleCheck?: () => void;
}

export function ConvertedIngredient({
  ingredient,
  displaySystem,
  servingMultiplier = 1,
  showOriginalTooltip = true,
  className,
  isChecked,
  onToggleCheck,
}: ConvertedIngredientProps) {
  const { quantityDisplay, unit, name, originalDisplay } = formatIngredientDisplay(
    ingredient,
    displaySystem === 'original' ? 'original' : displaySystem,
    servingMultiplier
  );

  const hasConversion = originalDisplay && displaySystem !== 'original';

  const content = (
    <span
      className={cn(
        'inline',
        isChecked && 'line-through text-neutral-400',
        className
      )}
    >
      {quantityDisplay && (
        <span className="font-medium">{quantityDisplay}</span>
      )}
      {unit && <span className="ml-1">{unit}</span>}
      {(quantityDisplay || unit) && <span className="ml-1">{name}</span>}
      {!quantityDisplay && !unit && <span>{name}</span>}
      {ingredient.notes && (
        <span className="text-neutral-500 ml-1">({ingredient.notes})</span>
      )}
      {ingredient.optional && (
        <span className="text-neutral-400 italic ml-1">(optional)</span>
      )}
    </span>
  );

  // If there's a conversion and we should show tooltip, wrap in tooltip
  if (hasConversion && showOriginalTooltip) {
    return (
      <span className="group relative inline">
        {onToggleCheck !== undefined ? (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={onToggleCheck}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            {content}
          </label>
        ) : (
          content
        )}
        <span
          className={cn(
            'invisible group-hover:visible',
            'absolute left-0 -top-8 z-10',
            'px-2 py-1 text-xs text-white bg-neutral-800 rounded shadow-lg whitespace-nowrap',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          )}
        >
          Original: {originalDisplay}
        </span>
      </span>
    );
  }

  // No tooltip needed
  if (onToggleCheck !== undefined) {
    return (
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onToggleCheck}
          className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        {content}
      </label>
    );
  }

  return content;
}

/**
 * Simpler version for displaying just the quantity and unit
 */
export function formatConvertedQuantity(
  ingredient: Ingredient,
  displaySystem: UnitDisplaySystem,
  servingMultiplier: number = 1
): string {
  const { quantityDisplay, unit } = formatIngredientDisplay(
    ingredient,
    displaySystem === 'original' ? 'original' : displaySystem,
    servingMultiplier
  );

  if (!quantityDisplay) return '';
  return unit ? `${quantityDisplay} ${unit}` : quantityDisplay;
}
