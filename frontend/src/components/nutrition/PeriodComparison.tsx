import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PeriodComparison as PeriodComparisonType } from '../../services/nutrition-analytics.service';

interface PeriodComparisonProps {
  comparison: PeriodComparisonType;
  period1Label?: string;
  period2Label?: string;
}

function ChangeIndicator({
  change,
  inverse = false,
}: {
  change: { absolute: number; percentage: number };
  inverse?: boolean;
}) {
  const isPositive = change.absolute > 0;
  const isNeutral = change.absolute === 0;
  const isGood = inverse ? !isPositive : isPositive;

  const Icon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown;
  const color = isNeutral
    ? 'text-neutral-400'
    : isGood
      ? 'text-green-600'
      : 'text-red-600';
  const bg = isNeutral
    ? 'bg-neutral-50'
    : isGood
      ? 'bg-green-50'
      : 'bg-red-50';

  return (
    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', bg, color)}>
      <Icon className="w-3 h-3" />
      <span className="font-medium">
        {isPositive ? '+' : ''}
        {change.percentage}%
      </span>
    </div>
  );
}

export function PeriodComparison({
  comparison,
  period1Label = 'Previous',
  period2Label = 'Current',
}: PeriodComparisonProps) {
  const metrics = [
    { key: 'calories', label: 'Calories', unit: 'cal', color: 'text-orange-600' },
    { key: 'protein', label: 'Protein', unit: 'g', color: 'text-blue-600' },
    { key: 'carbs', label: 'Carbs', unit: 'g', color: 'text-amber-600' },
    { key: 'fat', label: 'Fat', unit: 'g', color: 'text-pink-600' },
  ] as const;

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="space-y-4">
      {/* Period headers */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div />
        <div className="text-center">
          <div className="font-medium text-neutral-700">{period1Label}</div>
          <div className="text-xs text-neutral-500">
            {formatDateRange(comparison.period1.startDate, comparison.period1.endDate)}
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium text-neutral-700">{period2Label}</div>
          <div className="text-xs text-neutral-500">
            {formatDateRange(comparison.period2.startDate, comparison.period2.endDate)}
          </div>
        </div>
      </div>

      {/* Metrics */}
      {metrics.map(({ key, label, unit, color }) => (
        <div
          key={key}
          className="grid grid-cols-3 gap-4 items-center p-3 bg-neutral-50 rounded-lg"
        >
          <div className={cn('font-medium', color)}>{label}</div>
          <div className="text-center">
            <span className="text-lg font-semibold text-neutral-700">
              {comparison.period1.averages[key].toLocaleString()}
            </span>
            <span className="text-neutral-500 text-sm">{unit}</span>
          </div>
          <div className="text-center flex flex-col items-center gap-1">
            <div>
              <span className="text-lg font-semibold text-neutral-700">
                {comparison.period2.averages[key].toLocaleString()}
              </span>
              <span className="text-neutral-500 text-sm">{unit}</span>
            </div>
            <ChangeIndicator change={comparison.changes[key]} />
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="p-3 bg-primary-50 rounded-lg text-sm text-primary-700">
        <p>
          {comparison.changes.calories.percentage > 0
            ? `Calorie intake increased by ${comparison.changes.calories.percentage}% compared to the previous period.`
            : comparison.changes.calories.percentage < 0
              ? `Calorie intake decreased by ${Math.abs(comparison.changes.calories.percentage)}% compared to the previous period.`
              : 'Calorie intake remained stable compared to the previous period.'}
        </p>
      </div>
    </div>
  );
}
