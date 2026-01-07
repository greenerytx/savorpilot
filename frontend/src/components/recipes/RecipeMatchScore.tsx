import { useState } from 'react';
import { Sparkles, TrendingUp, Info, ChefHat } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRecipeMatchScore } from '../../hooks/useFlavorDna';

interface RecipeMatchScoreProps {
  recipeId: string;
  /** Compact mode for recipe cards */
  compact?: boolean;
  className?: string;
}

/**
 * Score color based on match percentage
 */
function getScoreColor(score: number): { text: string; bg: string; ring: string } {
  if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' };
  if (score >= 60) return { text: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' };
  if (score >= 40) return { text: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-200' };
  return { text: 'text-primary-500', bg: 'bg-primary-50', ring: 'ring-primary-200' };
}

/**
 * Get descriptive label for score
 */
function getScoreLabel(score: number): string {
  if (score >= 90) return 'Perfect Match';
  if (score >= 80) return 'Great Match';
  if (score >= 70) return 'Good Match';
  if (score >= 60) return 'Decent Match';
  if (score >= 50) return 'Fair Match';
  return 'New Discovery';
}

export function RecipeMatchScore({ recipeId, compact = false, className }: RecipeMatchScoreProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const { data: matchData, isLoading } = useRecipeMatchScore(recipeId);

  // Don't show while loading or if no profile
  if (isLoading) return null;

  // User doesn't have enough data for personalized scores
  if (!matchData?.hasProfile) {
    if (!compact) {
      return (
        <div className={cn('flex items-center gap-2 p-3 rounded-xl bg-cream-100', className)}>
          <ChefHat className="w-5 h-5 text-primary-400" />
          <div className="text-sm">
            <p className="font-medium text-primary-700">Building Your Taste Profile</p>
            <p className="text-xs text-primary-400">
              Cook {matchData?.recipesNeeded || 3} more recipe{(matchData?.recipesNeeded || 3) !== 1 ? 's' : ''} to unlock personalized match scores
            </p>
          </div>
        </div>
      );
    }
    return null; // Don't show anything in compact mode if no profile
  }

  const score = matchData.score ?? 0;
  const colors = getScoreColor(score);
  const label = getScoreLabel(score);

  // Compact mode for recipe cards
  if (compact) {
    return (
      <div
        className={cn(
          'relative flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-help',
          colors.bg,
          colors.text,
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={`${score}% match for you`}
      >
        <Sparkles className="w-2.5 h-2.5" />
        <span>{score}%</span>

        {/* Tooltip */}
        {showTooltip && matchData.matchReasons.length > 0 && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-white rounded-lg shadow-lg border border-cream-200 z-50 text-left">
            <p className="text-xs font-semibold text-primary-800 mb-1">{label}</p>
            <ul className="space-y-0.5">
              {matchData.matchReasons.slice(0, 3).map((reason, idx) => (
                <li key={idx} className="text-[10px] text-primary-500 flex items-start gap-1">
                  <span className="text-emerald-500">✓</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Full display for detail page
  return (
    <div className={cn('space-y-3', className)}>
      {/* Score Card */}
      <div className={cn('flex items-center gap-4 p-4 rounded-xl', colors.bg)}>
        {/* Circular progress */}
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-white/50"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={`${(score / 100) * 176} 176`}
              strokeLinecap="round"
              className={colors.text}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-xl font-bold', colors.text)}>{score}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className={cn('w-5 h-5', colors.text)} />
            <span className={cn('font-semibold', colors.text)}>{label}</span>
          </div>
          <p className="text-sm text-primary-500 mt-1">
            Based on your taste profile
          </p>
        </div>
      </div>

      {/* Match Reasons */}
      {matchData.matchReasons.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-primary-700 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Why this matches you
          </h4>
          <ul className="space-y-1.5">
            {matchData.matchReasons.map((reason, idx) => (
              <li
                key={idx}
                className="text-sm text-primary-600 flex items-center gap-2 pl-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Breakdown */}
      {matchData.breakdown && (
        <div className="grid grid-cols-5 gap-1 text-center">
          {[
            { key: 'cuisine', label: 'Cuisine', max: 40 },
            { key: 'complexity', label: 'Skill', max: 20 },
            { key: 'cookTime', label: 'Time', max: 20 },
            { key: 'popularity', label: 'Popular', max: 10 },
            { key: 'freshness', label: 'Fresh', max: 10 },
          ].map(({ key, label, max }) => {
            const value = matchData.breakdown![key as keyof typeof matchData.breakdown] || 0;
            const pct = Math.round((value / max) * 100);
            return (
              <div key={key} className="text-xs">
                <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden mb-1">
                  <div
                    className={cn('h-full rounded-full', colors.bg.replace('50', '400'))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-primary-400">{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Compact match badge for inline use
 */
export function MatchScoreBadge({ recipeId, className }: { recipeId: string; className?: string }) {
  const { data: matchData } = useRecipeMatchScore(recipeId);

  if (!matchData?.hasProfile || matchData.score === null) return null;

  const score = matchData.score;
  const colors = getScoreColor(score);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold',
        colors.bg,
        colors.text,
        className
      )}
      title={`${score}% match for you`}
    >
      <Sparkles className="w-2.5 h-2.5" />
      {score}%
    </span>
  );
}
