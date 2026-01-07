import React, { useState } from 'react';
import { useForkOutcomePrediction } from '../../hooks/useForkEnhancements';
import type { ForkOutcomePrediction, RiskFactor, RiskLevel } from '../../services/fork-enhancements.service';

interface ForkRiskWarningProps {
  recipeId: string;
  compact?: boolean;
  showOnlyIfRisky?: boolean;
}

export function ForkRiskWarning({
  recipeId,
  compact = false,
  showOnlyIfRisky = false,
}: ForkRiskWarningProps) {
  const { data: prediction, isLoading } = useForkOutcomePrediction(recipeId);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return compact ? null : <ForkRiskWarningSkeleton />;
  }

  if (!prediction) {
    return null;
  }

  // If showOnlyIfRisky and risk is low, don't show
  if (showOnlyIfRisky && prediction.overallRiskLevel === 'low') {
    return null;
  }

  if (compact) {
    return <CompactRiskBadge prediction={prediction} />;
  }

  return (
    <div className="space-y-4">
      <RiskSummary prediction={prediction} expanded={expanded} onToggle={() => setExpanded(!expanded)} />

      {expanded && (
        <>
          {prediction.riskFactors.length > 0 && (
            <FactorsList
              title="Risk Factors"
              factors={prediction.riskFactors}
              type="risk"
            />
          )}

          {prediction.positiveFactors.length > 0 && (
            <FactorsList
              title="Positive Factors"
              factors={prediction.positiveFactors}
              type="positive"
            />
          )}

          <StatsOverview stats={prediction.stats} />
        </>
      )}

      <RecommendationBox recommendation={prediction.recommendation} />
    </div>
  );
}

function ForkRiskWarningSkeleton() {
  return (
    <div className="bg-neutral-100 rounded-xl p-4 animate-pulse">
      <div className="h-6 w-48 bg-neutral-200 rounded mb-2" />
      <div className="h-4 w-64 bg-neutral-200 rounded" />
    </div>
  );
}

function CompactRiskBadge({ prediction }: { prediction: ForkOutcomePrediction }) {
  const riskConfig: Record<RiskLevel, { bg: string; text: string; icon: string; label: string }> = {
    low: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅', label: 'Safe' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '⚠️', label: 'Caution' },
    high: { bg: 'bg-red-100', text: 'text-red-700', icon: '🚨', label: 'Risky' },
  };

  const config = riskConfig[prediction.overallRiskLevel];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      title={prediction.recommendation.message}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {prediction.stats.totalCooks > 0 && (
        <span className="opacity-75">({prediction.stats.totalCooks} cooks)</span>
      )}
    </span>
  );
}

function RiskSummary({
  prediction,
  expanded,
  onToggle,
}: {
  prediction: ForkOutcomePrediction;
  expanded: boolean;
  onToggle: () => void;
}) {
  const riskConfig: Record<RiskLevel, { bg: string; border: string; icon: string; label: string }> = {
    low: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      label: 'Low Risk',
    },
    medium: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: '⚠️',
      label: 'Moderate Risk',
    },
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '🚨',
      label: 'High Risk',
    },
  };

  const config = riskConfig[prediction.overallRiskLevel];

  return (
    <button
      onClick={onToggle}
      className={`w-full text-left ${config.bg} border ${config.border} rounded-xl p-4 transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <div className="font-semibold text-neutral-800">{config.label}</div>
            <div className="text-sm text-neutral-600">
              {prediction.confidenceScore >= 70
                ? 'High confidence prediction'
                : prediction.confidenceScore >= 40
                  ? 'Moderate confidence'
                  : 'Limited data available'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ConfidenceMeter score={prediction.confidenceScore} />
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      {prediction.riskFactors.length > 0 && !expanded && (
        <div className="mt-3 flex flex-wrap gap-2">
          {prediction.riskFactors.slice(0, 3).map((factor) => (
            <span
              key={factor.id}
              className="text-xs bg-white/50 px-2 py-1 rounded"
            >
              {factor.icon} {factor.title}
            </span>
          ))}
          {prediction.riskFactors.length > 3 && (
            <span className="text-xs text-neutral-500">
              +{prediction.riskFactors.length - 3} more
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  return (
    <div className="text-center">
      <div className="text-sm font-medium text-neutral-800">{score}%</div>
      <div className="text-xs text-neutral-500">Confidence</div>
      <div className="w-16 h-1.5 bg-neutral-200 rounded-full mt-1 overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function FactorsList({
  title,
  factors,
  type,
}: {
  title: string;
  factors: RiskFactor[];
  type: 'risk' | 'positive';
}) {
  const bgColor = type === 'risk' ? 'bg-red-50' : 'bg-green-50';
  const borderColor = type === 'risk' ? 'border-red-100' : 'border-green-100';

  return (
    <div>
      <h4 className="font-medium text-neutral-800 mb-2">{title}</h4>
      <div className="space-y-2">
        {factors.map((factor) => (
          <div
            key={factor.id}
            className={`${bgColor} border ${borderColor} rounded-lg p-3 flex items-start gap-3`}
          >
            <span className="text-xl flex-shrink-0">{factor.icon}</span>
            <div>
              <div className="font-medium text-neutral-800">{factor.title}</div>
              <div className="text-sm text-neutral-600">{factor.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsOverview({ stats }: { stats: ForkOutcomePrediction['stats'] }) {
  return (
    <div className="bg-neutral-50 rounded-lg p-4">
      <h4 className="font-medium text-neutral-800 mb-3">Quick Stats</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatItem label="Cooks" value={stats.totalCooks.toString()} />
        <StatItem
          label="Success Rate"
          value={`${stats.successRate}%`}
          color={stats.successRate >= 70 ? 'text-green-600' : 'text-amber-600'}
        />
        <StatItem
          label="Avg Rating"
          value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
        />
        <StatItem
          label="Changes"
          value={`${stats.ingredientChanges + stats.stepChanges}`}
        />
      </div>

      {stats.comparedToParent && (
        <div className="mt-3 pt-3 border-t border-neutral-200">
          <div className="text-sm text-neutral-600">Compared to Original:</div>
          <div className="flex gap-4 mt-1">
            <ComparisonBadge
              label="Rating"
              diff={stats.comparedToParent.ratingDiff}
              format={(v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
            />
            <ComparisonBadge
              label="Success"
              diff={stats.comparedToParent.successRateDiff}
              format={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}%`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${color || 'text-neutral-800'}`}>
        {value}
      </div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

function ComparisonBadge({
  label,
  diff,
  format,
}: {
  label: string;
  diff: number;
  format: (v: number) => string;
}) {
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  return (
    <span
      className={`text-sm px-2 py-1 rounded ${
        isPositive
          ? 'bg-green-100 text-green-700'
          : isNegative
            ? 'bg-red-100 text-red-700'
            : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      {label}: {format(diff)}
    </span>
  );
}

function RecommendationBox({
  recommendation,
}: {
  recommendation: ForkOutcomePrediction['recommendation'];
}) {
  const actionConfig = {
    proceed: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '👍',
      title: 'Good to Go!',
    },
    proceed_with_caution: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: '⚠️',
      title: 'Proceed with Caution',
    },
    not_recommended: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '🛑',
      title: 'Not Recommended',
    },
  };

  const config = actionConfig[recommendation.action];

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{config.icon}</span>
        <span className="font-semibold text-neutral-800">{config.title}</span>
      </div>
      <p className="text-sm text-neutral-600">{recommendation.message}</p>
    </div>
  );
}
