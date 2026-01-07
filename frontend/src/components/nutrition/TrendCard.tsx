import { TrendingUp, TrendingDown, Minus, ChefHat } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TopRecipeItem, RollingAverageResponse } from '../../services/nutrition-analytics.service';

interface TrendCardProps {
  title: string;
  items: TopRecipeItem[];
  metricLabel: string;
  metricUnit?: string;
}

export function TrendCard({ title, items, metricLabel, metricUnit = '' }: TrendCardProps) {
  if (items.length === 0) {
    return (
      <div className="p-4 bg-neutral-50 rounded-xl">
        <h4 className="font-medium text-neutral-700 mb-3">{title}</h4>
        <p className="text-sm text-neutral-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-50 rounded-xl">
      <h4 className="font-medium text-neutral-700 mb-3">{title}</h4>
      <div className="space-y-2">
        {items.slice(0, 5).map((item, index) => (
          <div
            key={item.recipeId}
            className="flex items-center gap-3 p-2 bg-white rounded-lg"
          >
            <span className="w-5 h-5 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
              {index + 1}
            </span>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-8 h-8 rounded-md object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-neutral-100 rounded-md flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-neutral-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">
                {item.title}
              </p>
              <p className="text-xs text-neutral-500">
                {item.timesCooked}x cooked
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-700">
                {item.averageValue.toLocaleString()}
                {metricUnit}
              </p>
              <p className="text-xs text-neutral-500">{metricLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RollingTrendCardProps {
  data: RollingAverageResponse;
  label: string;
}

export function RollingTrendCard({ data, label }: RollingTrendCardProps) {
  const TrendIcon =
    data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    data.trend === 'up'
      ? 'text-green-500'
      : data.trend === 'down'
        ? 'text-red-500'
        : 'text-neutral-400';
  const trendBg =
    data.trend === 'up'
      ? 'bg-green-50'
      : data.trend === 'down'
        ? 'bg-red-50'
        : 'bg-neutral-50';

  return (
    <div className={cn('p-4 rounded-xl', trendBg)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-neutral-600">{label}</span>
        <TrendIcon className={cn('w-4 h-4', trendColor)} />
      </div>
      <div className="text-2xl font-bold text-neutral-800">
        {data.averages.calories.toLocaleString()}
      </div>
      <div className="text-xs text-neutral-500">cal/day avg</div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="font-semibold text-blue-600">{data.averages.protein}g</div>
          <div className="text-neutral-500">protein</div>
        </div>
        <div>
          <div className="font-semibold text-amber-600">{data.averages.carbs}g</div>
          <div className="text-neutral-500">carbs</div>
        </div>
        <div>
          <div className="font-semibold text-pink-600">{data.averages.fat}g</div>
          <div className="text-neutral-500">fat</div>
        </div>
      </div>
    </div>
  );
}
