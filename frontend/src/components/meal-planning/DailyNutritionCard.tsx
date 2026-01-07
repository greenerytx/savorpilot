import { useState } from 'react';
import { ChevronDown, ChevronUp, Flame, AlertCircle } from 'lucide-react';
import type { DailyNutritionSummary } from '../../services/meal-planning.service';
import { cn } from '../../lib/utils';
import { getMealTypeEmoji, getMealTypeLabel } from '../../hooks/useMealPlanning';

interface DailyNutritionCardProps {
  day: DailyNutritionSummary;
  className?: string;
}

export function DailyNutritionCard({ day, className }: DailyNutritionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = new Date(day.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const hasMissingNutrition = day.mealsWithoutNutrition > 0;

  return (
    <div className={cn('bg-neutral-50 rounded-xl overflow-hidden', className)}>
      {/* Day header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-700">{formattedDate}</span>
          {hasMissingNutrition && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {day.mealsWithoutNutrition} incomplete
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-neutral-800">{day.totals.calories}</span>
            <span className="text-neutral-400">cal</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="text-blue-600">{day.totals.protein}g P</span>
            <span className="text-amber-600">{day.totals.carbs}g C</span>
            <span className="text-rose-600">{day.totals.fat}g F</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          )}
        </div>
      </button>

      {/* Expanded meals list */}
      {isExpanded && day.meals.length > 0 && (
        <div className="border-t border-neutral-200 bg-white divide-y divide-neutral-100">
          {day.meals.map((meal, idx) => (
            <div key={idx} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{getMealTypeEmoji(meal.mealType)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {meal.recipeTitle}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {getMealTypeLabel(meal.mealType)} - {meal.servings} serving{meal.servings !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {meal.nutrition ? (
                <div className="flex items-center gap-4 text-xs flex-shrink-0">
                  <div className="text-center">
                    <p className="font-semibold text-orange-600">{meal.nutrition.calories}</p>
                    <p className="text-neutral-400">cal</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-blue-600">{meal.nutrition.protein}g</p>
                    <p className="text-neutral-400">protein</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-amber-600">{meal.nutrition.carbs}g</p>
                    <p className="text-neutral-400">carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-rose-600">{meal.nutrition.fat}g</p>
                    <p className="text-neutral-400">fat</p>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  No nutrition data
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DailyNutritionCard;
