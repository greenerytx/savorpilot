import { Link } from 'react-router-dom';
import { Loader2, Crown, Heart, ChefHat, ArrowRight } from 'lucide-react';
import { Card, Button } from '../ui';
import { cn } from '../../lib/utils';
import { useForkComparisonMatrix } from '../../hooks';

interface ForkComparisonMatrixProps {
  recipeId: string;
  className?: string;
  maxForks?: number;
}

export function ForkComparisonMatrix({
  recipeId,
  className,
  maxForks = 5,
}: ForkComparisonMatrixProps) {
  const { data, isLoading, error } = useForkComparisonMatrix(recipeId);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={cn('p-6 text-center text-neutral-500', className)}>
        Failed to load comparison data
      </Card>
    );
  }

  const displayForks = data.forks.slice(0, maxForks);
  const allItems = [data.original, ...displayForks];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-neutral-800">Compare Forks</h3>
        <p className="text-sm text-neutral-500 mt-1">
          See how forks differ from the original
        </p>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          {/* Header with recipe titles */}
          <thead>
            <tr className="border-b bg-neutral-50">
              <th className="p-3 text-left text-sm font-medium text-neutral-600 w-32">
                Attribute
              </th>
              {allItems.map((item, idx) => (
                <th
                  key={item.id}
                  className={cn(
                    'p-3 text-center min-w-[140px]',
                    idx === 0 && 'bg-primary-50',
                  )}
                >
                  <Link
                    to={`/recipes/${item.id}`}
                    className="group block"
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {idx === 0 && (
                        <Crown className="w-4 h-4 text-amber-500" />
                      )}
                      <span
                        className={cn(
                          'font-medium text-sm line-clamp-1 group-hover:text-primary-600',
                          idx === 0 ? 'text-primary-700' : 'text-neutral-800',
                        )}
                      >
                        {idx === 0 ? 'Original' : item.title}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-normal">
                      {item.author.firstName} {item.author.lastName}
                    </p>
                    {item.voteCount > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-1 text-xs text-neutral-400">
                        <Heart className="w-3 h-3" />
                        {item.voteCount}
                      </div>
                    )}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>

          {/* Data rows */}
          <tbody className="divide-y">
            {data.fields.map((field) => (
              <tr key={field.key} className="hover:bg-neutral-50">
                <td className="p-3 text-sm font-medium text-neutral-600">
                  {field.label}
                </td>
                {field.values.map((value, idx) => {
                  const isOriginal = idx === 0;
                  const originalValue = field.values[0];
                  const isDifferent = !isOriginal && value !== originalValue;
                  const isBetter = isDifferent && isValueBetter(field.key, value, originalValue);
                  const isWorse = isDifferent && isValueWorse(field.key, value, originalValue);

                  return (
                    <td
                      key={idx}
                      className={cn(
                        'p-3 text-center text-sm',
                        isOriginal && 'bg-primary-50/50',
                        isBetter && 'text-green-600 font-medium',
                        isWorse && 'text-red-600',
                        !isDifferent && !isOriginal && 'text-neutral-500',
                      )}
                    >
                      {value ?? '-'}
                      {isDifferent && (
                        <span className="ml-1 text-xs">
                          {isBetter ? '↓' : isWorse ? '↑' : '≠'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Fork note row */}
            <tr className="hover:bg-neutral-50">
              <td className="p-3 text-sm font-medium text-neutral-600">
                Note
              </td>
              {allItems.map((item, idx) => (
                <td
                  key={item.id}
                  className={cn(
                    'p-3 text-center text-sm italic text-neutral-500',
                    idx === 0 && 'bg-primary-50/50',
                  )}
                >
                  {item.forkNote || (idx === 0 ? '-' : 'No note')}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Show more link if there are more forks */}
      {data.forks.length > maxForks && (
        <div className="p-4 border-t bg-neutral-50 text-center">
          <Button variant="ghost" size="sm">
            View all {data.forks.length} forks
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
}

// Helper to determine if a value is "better" (lower is better for time, calories, steps)
function isValueBetter(
  key: string,
  value: string | number | null,
  originalValue: string | number | null,
): boolean {
  if (value === null || originalValue === null) return false;

  const numValue = parseNumericValue(value);
  const numOriginal = parseNumericValue(originalValue);

  if (numValue === null || numOriginal === null) return false;

  // Lower is better for these fields
  if (['totalTimeMinutes', 'stepCount', 'calories'].includes(key)) {
    return numValue < numOriginal;
  }

  return false;
}

function isValueWorse(
  key: string,
  value: string | number | null,
  originalValue: string | number | null,
): boolean {
  if (value === null || originalValue === null) return false;

  const numValue = parseNumericValue(value);
  const numOriginal = parseNumericValue(originalValue);

  if (numValue === null || numOriginal === null) return false;

  // Higher is worse for these fields
  if (['totalTimeMinutes', 'stepCount', 'calories'].includes(key)) {
    return numValue > numOriginal * 1.2; // 20% increase threshold
  }

  return false;
}

function parseNumericValue(value: string | number | null): number | null {
  if (value === null) return null;
  if (typeof value === 'number') return value;

  // Extract numbers from strings like "30 min" or "450 cal"
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
