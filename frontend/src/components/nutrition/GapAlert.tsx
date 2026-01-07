import { AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { NutrientGap } from '../../services/nutrition-analytics.service';

interface GapAlertProps {
  gaps: NutrientGap[];
}

const metricColors: Record<string, { bg: string; text: string; bar: string }> = {
  calories: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  protein: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
  carbs: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-500' },
  fat: { bg: 'bg-pink-50', text: 'text-pink-700', bar: 'bg-pink-500' },
  fiber: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
  sodium: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
};

export function GapAlert({ gaps }: GapAlertProps) {
  if (gaps.length === 0) {
    return (
      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-lg">✓</span>
          </div>
          <div>
            <p className="font-medium">Great job!</p>
            <p className="text-sm text-green-600">
              You're meeting all your nutrition goals
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-amber-700">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">Nutrition Gaps</span>
      </div>

      {gaps.map((gap) => {
        const colors = metricColors[gap.metric] || metricColors.calories;
        const percentage = Math.round((gap.actual / gap.goal) * 100);

        return (
          <div
            key={gap.metric}
            className={cn('p-3 rounded-lg border', colors.bg, 'border-neutral-200')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className={cn('w-4 h-4', colors.text)} />
                <span className={cn('font-medium', colors.text)}>{gap.label}</span>
              </div>
              <span className="text-sm text-neutral-600">
                {gap.daysUnderGoal} of {gap.totalDays} days under goal
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-lg font-bold text-neutral-800">
                {gap.actual.toLocaleString()}
              </span>
              <span className="text-neutral-500">
                / {gap.goal.toLocaleString()} ({percentage}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', colors.bar)}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-neutral-600">
              Short by{' '}
              <span className={cn('font-semibold', colors.text)}>
                {gap.deficit.toLocaleString()}
              </span>{' '}
              ({gap.deficitPercentage}% below target)
            </p>
          </div>
        );
      })}
    </div>
  );
}
