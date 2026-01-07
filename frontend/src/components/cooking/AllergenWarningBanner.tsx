import { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { CompatibilityReport, MemberConflict } from '../../services/recipe.service';
import { cn } from '../../lib/utils';

interface AllergenWarningBannerProps {
  compatibility: CompatibilityReport;
  circleName: string;
  circleEmoji?: string;
  onDismiss?: () => void;
}

export function AllergenWarningBanner({
  compatibility,
  circleName,
  circleEmoji = '👥',
  onDismiss,
}: AllergenWarningBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || compatibility.isCompatible) {
    return null;
  }

  const hasAllergenConflicts = compatibility.memberConflicts.some(
    (m) => m.allergenConflicts.length > 0
  );

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'border-b',
        hasAllergenConflicts
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      )}
    >
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className={cn(
              'w-5 h-5 flex-shrink-0 mt-0.5',
              hasAllergenConflicts ? 'text-red-600' : 'text-amber-600'
            )}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  'font-medium',
                  hasAllergenConflicts ? 'text-red-800' : 'text-amber-800'
                )}
              >
                {hasAllergenConflicts ? 'Allergen Warning' : 'Dietary Restriction Alert'}
              </p>
              <span className="text-sm text-neutral-500">
                for {circleEmoji} {circleName}
              </span>
            </div>

            <p
              className={cn(
                'text-sm mt-1',
                hasAllergenConflicts ? 'text-red-700' : 'text-amber-700'
              )}
            >
              {compatibility.summary}
            </p>

            {/* Affected Members Preview */}
            <div className="flex flex-wrap gap-1 mt-2">
              {compatibility.memberConflicts.slice(0, 3).map((member) => (
                <span
                  key={member.memberId}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    hasAllergenConflicts
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {member.avatarEmoji || '👤'} {member.memberName}
                </span>
              ))}
              {compatibility.memberConflicts.length > 3 && (
                <span className="text-xs text-neutral-500 self-center">
                  +{compatibility.memberConflicts.length - 3} more
                </span>
              )}
            </div>

            {/* Expand/Collapse for details */}
            {compatibility.memberConflicts.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                  'flex items-center gap-1 text-sm mt-2',
                  hasAllergenConflicts
                    ? 'text-red-600 hover:text-red-700'
                    : 'text-amber-600 hover:text-amber-700'
                )}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    View details
                  </>
                )}
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className={cn(
              'p-1 rounded-lg transition-colors',
              hasAllergenConflicts
                ? 'hover:bg-red-100 text-red-600'
                : 'hover:bg-amber-100 text-amber-600'
            )}
            title="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 space-y-3 pl-8">
            {compatibility.memberConflicts.map((member) => (
              <MemberConflictDetails
                key={member.memberId}
                member={member}
                isAllergen={hasAllergenConflicts}
              />
            ))}

            {/* All problematic ingredients */}
            {compatibility.allConflictingIngredients.length > 0 && (
              <div className="pt-2 border-t border-neutral-200">
                <p className="text-xs font-medium text-neutral-500 uppercase mb-2">
                  Ingredients to avoid
                </p>
                <div className="flex flex-wrap gap-1">
                  {compatibility.allConflictingIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="px-2 py-0.5 bg-white/50 border border-current rounded text-xs font-medium"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberConflictDetails({
  member,
  isAllergen,
}: {
  member: MemberConflict;
  isAllergen: boolean;
}) {
  return (
    <div className="bg-white/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{member.avatarEmoji || '👤'}</span>
        <span className="font-medium text-neutral-800">{member.memberName}</span>
      </div>

      {member.allergenConflicts.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-red-600 mb-1">Allergens:</p>
          <div className="flex flex-wrap gap-1">
            {member.allergenConflicts.map((conflict, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
              >
                {conflict.ingredientName} ({conflict.allergens.join(', ')})
              </span>
            ))}
          </div>
        </div>
      )}

      {member.restrictionConflicts.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-600 mb-1">Restrictions:</p>
          <div className="flex flex-wrap gap-1">
            {member.restrictionConflicts.map((conflict, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
              >
                {conflict.ingredientName} ({conflict.allergens.join(', ')})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AllergenWarningBanner;
