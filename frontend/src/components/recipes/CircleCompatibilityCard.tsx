import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldQuestion,
  ChevronDown,
  Users,
  AlertTriangle,
  Loader2,
  Info,
  Globe,
} from 'lucide-react';
import { Card, Button } from '../ui';
import { useCircles } from '../../hooks/useDinnerCircles';
import {
  useRecipeCompatibility,
  formatAffectedMembers,
  getCompatibilitySeverity,
} from '../../hooks/useRecipeCompatibility';
import type { CompatibilityReport, MemberConflict } from '../../services/recipe.service';
import { cn } from '../../lib/utils';

interface CircleCompatibilityCardProps {
  recipeId: string;
  className?: string;
}

export function CircleCompatibilityCard({
  recipeId,
  className,
}: CircleCompatibilityCardProps) {
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { data: circles, isLoading: circlesLoading } = useCircles();
  const {
    data: compatibility,
    isLoading: compatibilityLoading,
  } = useRecipeCompatibility(recipeId, selectedCircleId || undefined);

  // Auto-select first circle when circles are loaded
  useEffect(() => {
    if (!selectedCircleId && circles && circles.length > 0) {
      setSelectedCircleId(circles[0].id);
    }
  }, [circles, selectedCircleId]);

  const selectedCircle = circles?.find((c) => c.id === selectedCircleId);

  if (circlesLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading circles...</span>
        </div>
      </Card>
    );
  }

  if (!circles || circles.length === 0) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-700">No Dinner Circles</p>
            <p className="text-xs text-neutral-500">
              Create a circle to check dietary compatibility
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const severity = compatibility ? getCompatibilitySeverity(compatibility) : null;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with Circle Selector */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            <span className="font-medium text-neutral-800">Dietary Check</span>
          </div>

          {/* Circle Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
            >
              <span>{selectedCircle?.emoji || '👥'}</span>
              <span>{selectedCircle?.name || 'Select Circle'}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', showDropdown && 'rotate-180')} />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 z-20">
                  {circles.map((circle) => (
                    <button
                      key={circle.id}
                      onClick={() => {
                        setSelectedCircleId(circle.id);
                        setShowDropdown(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2',
                        circle.id === selectedCircleId && 'bg-primary-50 text-primary-700'
                      )}
                    >
                      <span>{circle.emoji || '👥'}</span>
                      <span>{circle.name}</span>
                      <span className="text-neutral-400 ml-auto">
                        {circle.memberCount}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Compatibility Status */}
      <div className="p-4">
        {compatibilityLoading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            <span className="text-sm text-neutral-600">Checking compatibility...</span>
          </div>
        ) : compatibility ? (
          <div className="space-y-3">
            {/* Language Not Supported Warning */}
            {!compatibility.languageSupported ? (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                <ShieldQuestion className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800">
                    Cannot Verify Dietary Compatibility
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {compatibility.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                    <Globe className="w-4 h-4" />
                    <span>Supported languages: English, Arabic, Spanish, French</span>
                  </div>
                  <p className="text-xs mt-2 text-blue-600">
                    Please manually check the ingredients for allergens before serving.
                  </p>
                </div>
              </div>
            ) : (
              /* Status Badge */
              <div className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                severity === 'safe' && 'bg-green-50',
                severity === 'warning' && 'bg-amber-50',
                severity === 'danger' && 'bg-red-50',
              )}>
                {severity === 'safe' && (
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                )}
                {severity === 'warning' && (
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                )}
                {severity === 'danger' && (
                  <ShieldX className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p className={cn(
                    'font-medium',
                    severity === 'safe' && 'text-green-800',
                    severity === 'warning' && 'text-amber-800',
                    severity === 'danger' && 'text-red-800',
                  )}>
                    {compatibility.isCompatible
                      ? 'Safe for Everyone'
                      : `Conflicts Detected`}
                  </p>
                  <p className={cn(
                    'text-sm',
                    severity === 'safe' && 'text-green-600',
                    severity === 'warning' && 'text-amber-600',
                    severity === 'danger' && 'text-red-600',
                  )}>
                    {compatibility.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Conflict Details (collapsible) - only show when language is supported */}
            {compatibility.languageSupported && !compatibility.isCompatible && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-800"
                >
                  <Info className="w-4 h-4" />
                  <span>View details</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showDetails && 'rotate-180')} />
                </button>

                {showDetails && (
                  <div className="mt-3 space-y-3">
                    {/* Affected Members */}
                    {compatibility.memberConflicts.map((member) => (
                      <MemberConflictCard key={member.memberId} member={member} />
                    ))}

                    {/* Conflicting Ingredients Summary */}
                    {compatibility.allConflictingIngredients.length > 0 && (
                      <div className="pt-2 border-t border-neutral-100">
                        <p className="text-xs font-medium text-neutral-500 uppercase mb-2">
                          Problematic Ingredients
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {compatibility.allConflictingIngredients.map((ingredient) => (
                            <span
                              key={ingredient}
                              className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
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
            )}

            {/* Safe Members - only show when language is supported */}
            {compatibility.languageSupported && compatibility.safeForMembers.length > 0 && compatibility.memberConflicts.length > 0 && (
              <div className="pt-2 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">
                  Safe for: {formatAffectedMembers(compatibility.safeForMembers.map(m => m.memberName))}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-neutral-500 py-2">
            <p className="text-sm">Select a circle to check compatibility</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Sub-component for member conflict details
function MemberConflictCard({ member }: { member: MemberConflict }) {
  const hasAllergens = member.allergenConflicts.length > 0;
  const hasRestrictions = member.restrictionConflicts.length > 0;

  return (
    <div className="p-3 bg-neutral-50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{member.avatarEmoji || '👤'}</span>
        <span className="font-medium text-neutral-800">{member.memberName}</span>
      </div>

      {hasAllergens && (
        <div className="mb-2">
          <p className="text-xs font-medium text-red-600 mb-1">Allergen Conflicts:</p>
          <div className="flex flex-wrap gap-1">
            {member.allergenConflicts.map((conflict, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                title={`${conflict.ingredientName} contains ${conflict.allergens.join(', ')}`}
              >
                {conflict.ingredientName} ({conflict.allergens.join(', ')})
              </span>
            ))}
          </div>
        </div>
      )}

      {hasRestrictions && (
        <div>
          <p className="text-xs font-medium text-amber-600 mb-1">Restriction Conflicts:</p>
          <div className="flex flex-wrap gap-1">
            {member.restrictionConflicts.map((conflict, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
                title={`${conflict.ingredientName} violates ${conflict.allergens.join(', ')}`}
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

export default CircleCompatibilityCard;
