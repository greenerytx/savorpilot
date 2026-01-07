import { cn } from '../../lib/utils';

interface GoalProgressCardProps {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function getVarianceStatus(value: number, goal: number): 'good' | 'warning' | 'danger' {
  const ratio = value / goal;
  if (ratio >= 0.9 && ratio <= 1.1) return 'good';
  if (ratio >= 0.75 && ratio <= 1.25) return 'warning';
  return 'danger';
}

const statusColors = {
  good: {
    text: 'text-green-600',
    bg: 'bg-green-500',
    ring: 'ring-green-200',
  },
  warning: {
    text: 'text-amber-600',
    bg: 'bg-amber-500',
    ring: 'ring-amber-200',
  },
  danger: {
    text: 'text-red-600',
    bg: 'bg-red-500',
    ring: 'ring-red-200',
  },
};

export function GoalProgressCard({
  label,
  value,
  goal,
  unit = '',
  icon,
  color,
  bgColor,
}: GoalProgressCardProps) {
  const percentage = Math.min(Math.round((value / goal) * 100), 150);
  const displayPercentage = Math.min(percentage, 100);
  const variance = value - goal;
  const variancePercent = Math.round((variance / goal) * 100);
  const status = getVarianceStatus(value, goal);
  const statusColor = statusColors[status];

  return (
    <div className={cn('p-4 rounded-xl', bgColor)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg bg-white/50', color)}>{icon}</div>
          <span className="font-medium text-neutral-700">{label}</span>
        </div>
        <div
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            statusColor.text,
            statusColor.ring,
            'ring-1'
          )}
        >
          {variancePercent > 0 ? '+' : ''}
          {variancePercent}%
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className={cn('text-2xl font-bold', statusColor.text)}>
          {value.toLocaleString()}
        </span>
        <span className="text-neutral-500 text-sm">
          / {goal.toLocaleString()}
          {unit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', statusColor.bg)}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>

      {/* Variance indicator */}
      <div className="mt-2 text-xs text-neutral-500">
        {variance > 0 ? (
          <span>
            <span className={statusColor.text}>+{Math.abs(variance).toLocaleString()}{unit}</span> over goal
          </span>
        ) : variance < 0 ? (
          <span>
            <span className={statusColor.text}>{Math.abs(variance).toLocaleString()}{unit}</span> under goal
          </span>
        ) : (
          <span className="text-green-600">On target!</span>
        )}
      </div>
    </div>
  );
}
