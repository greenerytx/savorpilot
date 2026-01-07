import { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Star, Clock, Users, Camera, Zap, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useForkValidationStats, useForkOutcomePrediction } from '../../hooks/useForkEnhancements';
import type { ValidationBadge, RiskLevel } from '../../services/fork-enhancements.service';

interface RecipeTrustIndicatorProps {
  recipeId: string;
  /** Compact mode for recipe cards */
  compact?: boolean;
  className?: string;
}

// Badge icon mapping
const BADGE_ICONS: Record<string, React.ElementType> = {
  verified: ShieldCheck,
  highly_rated: Star,
  time_accurate: Clock,
  crowd_favorite: Users,
  photo_verified: Camera,
  quick_win: Zap,
  beginner_friendly: Users,
  expert_approved: ShieldCheck,
};

// Badge colors
const BADGE_COLORS: Record<string, string> = {
  verified: 'text-emerald-600 bg-emerald-50',
  highly_rated: 'text-amber-600 bg-amber-50',
  time_accurate: 'text-blue-600 bg-blue-50',
  crowd_favorite: 'text-rose-600 bg-rose-50',
  photo_verified: 'text-purple-600 bg-purple-50',
  quick_win: 'text-orange-600 bg-orange-50',
  beginner_friendly: 'text-teal-600 bg-teal-50',
  expert_approved: 'text-indigo-600 bg-indigo-50',
};

// Risk level config
const RISK_CONFIG: Record<RiskLevel, { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  low: { color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: ShieldCheck, label: 'Trusted' },
  medium: { color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Shield, label: 'Some Risk' },
  high: { color: 'text-rose-600', bgColor: 'bg-rose-50', icon: ShieldAlert, label: 'Untested' },
};

export function RecipeTrustIndicator({ recipeId, compact = false, className }: RecipeTrustIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const { data: validationStats, isLoading: loadingStats } = useForkValidationStats(recipeId);
  const { data: prediction, isLoading: loadingPrediction } = useForkOutcomePrediction(recipeId);

  // Don't show anything while loading or if no data
  if (loadingStats && loadingPrediction) return null;

  const badges = validationStats?.badges?.filter(b => b.earnedAt) || [];
  const successRate = validationStats?.successRate ?? 0;
  const totalCooks = validationStats?.totalCooks ?? 0;
  const riskLevel = prediction?.overallRiskLevel ?? 'high';
  const riskConfig = RISK_CONFIG[riskLevel];

  // Compact mode: Show just the primary indicator
  if (compact) {
    // If no cooks yet, show nothing or a subtle indicator
    if (totalCooks === 0) {
      return (
        <div
          className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
            'bg-primary-100/50 text-primary-500',
            className
          )}
          title="No cook data yet"
        >
          <Info className="w-2.5 h-2.5" />
          <span>New</span>
        </div>
      );
    }

    // Show success rate badge
    const RiskIcon = riskConfig.icon;
    return (
      <div
        className={cn(
          'relative flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help',
          riskConfig.bgColor,
          riskConfig.color,
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={`${Math.round(successRate)}% success rate from ${totalCooks} cooks`}
      >
        <RiskIcon className="w-2.5 h-2.5" />
        <span>{Math.round(successRate)}%</span>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-white rounded-lg shadow-lg border border-cream-200 z-50 text-left">
            <p className="text-xs font-semibold text-primary-800 mb-1">
              {riskConfig.label}
            </p>
            <p className="text-[10px] text-primary-500">
              {totalCooks} cook{totalCooks !== 1 ? 's' : ''} • {Math.round(successRate)}% success
            </p>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {badges.slice(0, 3).map((badge) => {
                  const Icon = BADGE_ICONS[badge.type] || ShieldCheck;
                  return (
                    <span
                      key={badge.type}
                      className={cn(
                        'flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px]',
                        BADGE_COLORS[badge.type]
                      )}
                    >
                      <Icon className="w-2 h-2" />
                      {badge.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full display mode for detail page
  return (
    <div className={cn('space-y-3', className)}>
      {/* Success Rate Card */}
      <div className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        riskConfig.bgColor
      )}>
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          'bg-white/60'
        )}>
          {(() => {
            const RiskIcon = riskConfig.icon;
            return <RiskIcon className={cn('w-5 h-5', riskConfig.color)} />;
          })()}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold', riskConfig.color)}>
              {totalCooks > 0 ? `${Math.round(successRate)}%` : '—'}
            </span>
            <span className="text-sm text-primary-500">success rate</span>
          </div>
          <p className="text-xs text-primary-400">
            {totalCooks > 0
              ? `Based on ${totalCooks} cook${totalCooks !== 1 ? 's' : ''}`
              : 'No cook data yet - be the first!'
            }
          </p>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => {
            const Icon = BADGE_ICONS[badge.type] || ShieldCheck;
            return (
              <div
                key={badge.type}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                  BADGE_COLORS[badge.type]
                )}
                title={badge.description}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{badge.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendation */}
      {prediction?.recommendation && totalCooks > 0 && (
        <div className={cn(
          'text-xs p-2 rounded-lg',
          prediction.recommendation.action === 'proceed' && 'bg-emerald-50 text-emerald-700',
          prediction.recommendation.action === 'proceed_with_caution' && 'bg-amber-50 text-amber-700',
          prediction.recommendation.action === 'not_recommended' && 'bg-rose-50 text-rose-700'
        )}>
          {prediction.recommendation.message}
        </div>
      )}
    </div>
  );
}

/**
 * Compact success rate badge for inline use
 */
export function SuccessRateBadge({ recipeId, className }: { recipeId: string; className?: string }) {
  const { data: stats } = useForkValidationStats(recipeId);

  if (!stats || stats.totalCooks === 0) return null;

  const successRate = Math.round(stats.successRate);
  const color = successRate >= 80 ? 'text-emerald-600 bg-emerald-50'
    : successRate >= 60 ? 'text-amber-600 bg-amber-50'
    : 'text-rose-600 bg-rose-50';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold',
        color,
        className
      )}
      title={`${successRate}% success rate from ${stats.totalCooks} cooks`}
    >
      <ShieldCheck className="w-2.5 h-2.5" />
      {successRate}%
    </span>
  );
}
