import React from 'react';
import { useForkValidationStats } from '../../hooks/useForkEnhancements';
import type { ValidationBadge, CookTrial } from '../../services/fork-enhancements.service';

interface ForkValidationBadgesProps {
  recipeId: string;
  compact?: boolean;
}

export function ForkValidationBadges({
  recipeId,
  compact = false,
}: ForkValidationBadgesProps) {
  const { data: stats, isLoading } = useForkValidationStats(recipeId);

  if (isLoading) {
    return <ValidationBadgesSkeleton compact={compact} />;
  }

  if (!stats || stats.totalCooks === 0) {
    return compact ? null : <NoCooksYet />;
  }

  if (compact) {
    return <CompactBadges badges={stats.badges} totalCooks={stats.totalCooks} />;
  }

  return (
    <div className="space-y-6">
      <ValidationStatsOverview stats={stats} />
      <BadgeDisplay badges={stats.badges} />
      {stats.comparedToParent && <ParentComparison comparison={stats.comparedToParent} />}
      {stats.recentTrials.length > 0 && <RecentTrials trials={stats.recentTrials} />}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function ValidationBadgesSkeleton({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="flex gap-1">
        {[1, 2].map((i) => (
          <div key={i} className="h-6 w-6 rounded-full bg-neutral-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-24 bg-neutral-200 rounded-xl animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-24 bg-neutral-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function NoCooksYet() {
  return (
    <div className="text-center py-8 text-neutral-500">
      <span className="text-4xl mb-2 block">👨‍🍳</span>
      <p className="font-medium">No cook trials yet</p>
      <p className="text-sm">Be the first to try this recipe and share your results!</p>
    </div>
  );
}

function CompactBadges({
  badges,
  totalCooks,
}: {
  badges: ValidationBadge[];
  totalCooks: number;
}) {
  const earnedBadges = badges.filter((b) => b.earnedAt);

  if (earnedBadges.length === 0 && totalCooks < 3) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {earnedBadges.slice(0, 3).map((badge) => (
        <span
          key={badge.type}
          className="text-lg"
          title={`${badge.label}: ${badge.description}`}
        >
          {badge.icon}
        </span>
      ))}
      {totalCooks >= 3 && (
        <span className="text-xs text-neutral-500 ml-1">
          {totalCooks} cooks
        </span>
      )}
    </div>
  );
}

interface ValidationStats {
  totalCooks: number;
  successRate: number;
  averageRating: number;
  wouldMakeAgainRate: number;
  ratingDistribution: {
    rating1: number;
    rating2: number;
    rating3: number;
    rating4: number;
  };
}

function ValidationStatsOverview({ stats }: { stats: ValidationStats }) {
  const ratingEmojis = ['😞', '😐', '😊', '🤩'];
  const ratingIndex = Math.min(Math.floor(stats.averageRating) - 1, 3);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4">
      <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
        <span>📊</span> Community Validation
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          value={stats.totalCooks}
          label="Total Cooks"
        />
        <StatCard
          icon="✅"
          value={`${Math.round(stats.successRate)}%`}
          label="Success Rate"
          color={stats.successRate >= 80 ? 'text-green-600' : undefined}
        />
        <StatCard
          icon={ratingEmojis[ratingIndex] || '⭐'}
          value={stats.averageRating.toFixed(1)}
          label="Avg Rating"
        />
        <StatCard
          icon="❤️"
          value={`${Math.round(stats.wouldMakeAgainRate)}%`}
          label="Would Make Again"
          color={stats.wouldMakeAgainRate >= 80 ? 'text-red-500' : undefined}
        />
      </div>

      <RatingDistribution distribution={stats.ratingDistribution} />
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <span className="text-xl">{icon}</span>
      <div className={`text-xl font-bold ${color || 'text-neutral-800'}`}>
        {value}
      </div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

function RatingDistribution({
  distribution,
}: {
  distribution: { rating1: number; rating2: number; rating3: number; rating4: number };
}) {
  const total =
    distribution.rating1 +
    distribution.rating2 +
    distribution.rating3 +
    distribution.rating4;

  if (total === 0) return null;

  const ratings = [
    { emoji: '😞', count: distribution.rating1, label: 'Didn\'t work' },
    { emoji: '😐', count: distribution.rating2, label: 'Okay' },
    { emoji: '😊', count: distribution.rating3, label: 'Good' },
    { emoji: '🤩', count: distribution.rating4, label: 'Amazing' },
  ];

  return (
    <div className="mt-4 pt-4 border-t border-amber-200">
      <div className="flex gap-1 h-8">
        {ratings.map((rating, idx) => {
          const percentage = (rating.count / total) * 100;
          if (percentage === 0) return null;

          return (
            <div
              key={idx}
              className="flex items-center justify-center bg-white/50 rounded text-sm"
              style={{ width: `${percentage}%` }}
              title={`${rating.label}: ${rating.count} (${Math.round(percentage)}%)`}
            >
              {percentage >= 15 && <span>{rating.emoji}</span>}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-neutral-500 mt-1">
        <span>😞</span>
        <span>🤩</span>
      </div>
    </div>
  );
}

function BadgeDisplay({ badges }: { badges: ValidationBadge[] }) {
  const earnedBadges = badges.filter((b) => b.earnedAt);
  const progressBadges = badges.filter((b) => !b.earnedAt && (b.progress || 0) > 0);

  if (earnedBadges.length === 0 && progressBadges.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {earnedBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-600 mb-2">Earned Badges</h4>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge) => (
              <BadgeItem key={badge.type} badge={badge} earned />
            ))}
          </div>
        </div>
      )}

      {progressBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-400 mb-2">In Progress</h4>
          <div className="flex flex-wrap gap-2">
            {progressBadges.map((badge) => (
              <BadgeItem key={badge.type} badge={badge} earned={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeItem({ badge, earned }: { badge: ValidationBadge; earned: boolean }) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
        ${earned
          ? 'bg-amber-100 text-amber-800 border border-amber-200'
          : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
        }
      `}
      title={badge.description}
    >
      <span>{badge.icon}</span>
      <span className="font-medium">{badge.label}</span>
      {!earned && badge.progress !== undefined && badge.threshold !== undefined && (
        <span className="text-xs opacity-75">
          ({badge.progress}/{badge.threshold})
        </span>
      )}
    </div>
  );
}

interface ParentComparisonData {
  ratingDiff: number;
  successRateDiff: number;
  cookCountDiff: number;
  verdict: 'better' | 'similar' | 'worse' | 'insufficient_data';
}

function ParentComparison({ comparison }: { comparison: ParentComparisonData }) {
  const verdictConfig = {
    better: { icon: '🏆', text: 'Outperforming original', color: 'text-green-600' },
    similar: { icon: '🤝', text: 'Similar to original', color: 'text-blue-600' },
    worse: { icon: '📉', text: 'Below original', color: 'text-orange-600' },
    insufficient_data: { icon: '📊', text: 'Need more data', color: 'text-neutral-500' },
  };

  const config = verdictConfig[comparison.verdict];

  return (
    <div className="bg-neutral-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-neutral-600 mb-2">Compared to Original</h4>
      <div className={`flex items-center gap-2 ${config.color}`}>
        <span className="text-xl">{config.icon}</span>
        <span className="font-medium">{config.text}</span>
      </div>

      {comparison.verdict !== 'insufficient_data' && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <ComparisonStat
            label="Rating"
            diff={comparison.ratingDiff}
            format={(v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
          />
          <ComparisonStat
            label="Success"
            diff={comparison.successRateDiff}
            format={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}%`}
          />
          <ComparisonStat
            label="Cooks"
            diff={comparison.cookCountDiff}
            format={(v) => `${v > 0 ? '+' : ''}${v}`}
          />
        </div>
      )}
    </div>
  );
}

function ComparisonStat({
  label,
  diff,
  format,
}: {
  label: string;
  diff: number;
  format: (v: number) => string;
}) {
  const color =
    diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-neutral-500';

  return (
    <div className="text-center">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`font-medium ${color}`}>{format(diff)}</div>
    </div>
  );
}

function RecentTrials({ trials }: { trials: CookTrial[] }) {
  const ratingEmojis = ['😞', '😐', '😊', '🤩'];

  return (
    <div>
      <h4 className="text-sm font-medium text-neutral-600 mb-3">Recent Cook Trials</h4>
      <div className="space-y-3">
        {trials.slice(0, 5).map((trial) => (
          <div
            key={trial.id}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-neutral-200"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
              {trial.user.avatarUrl ? (
                <img
                  src={trial.user.avatarUrl}
                  alt={trial.user.firstName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg">{trial.user.firstName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-800">
                  {trial.user.firstName} {trial.user.lastName.charAt(0)}.
                </span>
                <span className="text-lg">{ratingEmojis[trial.rating - 1] || '⭐'}</span>
                {trial.wouldMakeAgain && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    ❤️ Would make again
                  </span>
                )}
              </div>
              {trial.notes && (
                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{trial.notes}</p>
              )}
              {trial.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {trial.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-xs text-neutral-400 mt-1">
                {new Date(trial.cookedAt).toLocaleDateString()}
              </div>
            </div>
            {trial.photoUrl && (
              <img
                src={trial.photoUrl}
                alt="Cook result"
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
