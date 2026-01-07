import { useState } from 'react';
import { AlertTriangle, ShieldX, ShieldQuestion, ChevronDown, Info, Globe } from 'lucide-react';
import { Card } from '../ui';
import { usePersonalCompatibility, getPersonalCompatibilitySeverity } from '../../hooks/useRecipeCompatibility';
import { cn } from '../../lib/utils';
import type { IngredientConflict } from '../../services/recipe.service';

interface PersonalAllergenWarningProps {
  recipeId: string;
  className?: string;
}

export function PersonalAllergenWarning({
  recipeId,
  className,
}: PersonalAllergenWarningProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { data: compatibility, isLoading, error } = usePersonalCompatibility(recipeId);

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // Don't show if error or no data
  if (error || !compatibility) {
    return null;
  }

  // Don't show if no dietary preferences set
  if (compatibility.summary === 'No dietary preferences set') {
    return null;
  }

  // Show warning if language is not supported
  if (!compatibility.languageSupported) {
    return (
      <Card
        className={cn(
          'overflow-hidden border-2 border-blue-300 bg-blue-50',
          className
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <ShieldQuestion className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800">
                Cannot Verify Dietary Compatibility
              </h3>
              <p className="text-sm mt-1 text-blue-700">
                {compatibility.summary}
              </p>
              <div className="flex items-center gap-2 mt-3 text-sm text-blue-600">
                <Globe className="w-4 h-4" />
                <span>
                  Supported languages: English, Arabic, Spanish, French
                </span>
              </div>
              <p className="text-xs mt-2 text-blue-600">
                Please manually check the ingredients for allergens before consuming.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Don't show if compatible
  if (compatibility.isCompatible) {
    return null;
  }

  const severity = getPersonalCompatibilitySeverity(compatibility);
  const hasAllergenConflicts = compatibility.allergenConflicts.length > 0;
  const hasRestrictionConflicts = compatibility.restrictionConflicts.length > 0;

  return (
    <Card
      className={cn(
        'overflow-hidden border-2',
        severity === 'danger' && 'border-red-300 bg-red-50',
        severity === 'warning' && 'border-amber-300 bg-amber-50',
        className
      )}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {severity === 'danger' ? (
            <ShieldX className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h3
              className={cn(
                'font-semibold',
                severity === 'danger' ? 'text-red-800' : 'text-amber-800'
              )}
            >
              {severity === 'danger' ? 'Allergen Warning' : 'Dietary Conflict'}
            </h3>
            <p
              className={cn(
                'text-sm mt-1',
                severity === 'danger' ? 'text-red-700' : 'text-amber-700'
              )}
            >
              {compatibility.summary}
            </p>
          </div>
        </div>

        {/* Conflicting ingredients summary */}
        {compatibility.allConflictingIngredients.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5">
              {compatibility.allConflictingIngredients.map((ingredient) => (
                <span
                  key={ingredient}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    severity === 'danger'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-amber-200 text-amber-800'
                  )}
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expand/collapse button */}
        {(hasAllergenConflicts || hasRestrictionConflicts) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={cn(
              'flex items-center gap-1.5 text-sm mt-3 hover:underline',
              severity === 'danger' ? 'text-red-700' : 'text-amber-700'
            )}
          >
            <Info className="w-4 h-4" />
            <span>View details</span>
            <ChevronDown
              className={cn('w-4 h-4 transition-transform', showDetails && 'rotate-180')}
            />
          </button>
        )}
      </div>

      {/* Details section */}
      {showDetails && (
        <div
          className={cn(
            'px-4 pb-4 space-y-3',
            severity === 'danger' ? 'text-red-800' : 'text-amber-800'
          )}
        >
          {/* Allergen conflicts */}
          {hasAllergenConflicts && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2">Allergen Conflicts</p>
              <div className="space-y-1.5">
                {compatibility.allergenConflicts.map((conflict, idx) => (
                  <ConflictItem key={idx} conflict={conflict} severity="danger" />
                ))}
              </div>
            </div>
          )}

          {/* Restriction conflicts */}
          {hasRestrictionConflicts && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2">Dietary Restriction Conflicts</p>
              <div className="space-y-1.5">
                {compatibility.restrictionConflicts.map((conflict, idx) => (
                  <ConflictItem key={idx} conflict={conflict} severity="warning" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ConflictItem({
  conflict,
  severity,
}: {
  conflict: IngredientConflict;
  severity: 'danger' | 'warning';
}) {
  return (
    <div
      className={cn(
        'p-2 rounded text-sm',
        severity === 'danger' ? 'bg-red-100' : 'bg-amber-100'
      )}
    >
      <span className="font-medium">{conflict.ingredientName}</span>
      {conflict.componentName && conflict.componentName !== 'Main' && (
        <span className="opacity-75"> ({conflict.componentName})</span>
      )}
      <span className="opacity-75"> - contains </span>
      <span className="font-medium">{conflict.allergens.join(', ')}</span>
    </div>
  );
}

export default PersonalAllergenWarning;
