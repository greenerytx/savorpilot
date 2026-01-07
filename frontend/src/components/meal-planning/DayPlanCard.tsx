import { RefreshCw, Clock, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { Button, Card } from '../ui';
import type {
  DailyPlanSummary,
  GeneratedMealEntry,
  MealType,
} from '../../services/meal-planning.service';
import { getImageUrl, cn } from '../../lib/utils';

interface DayPlanCardProps {
  dayPlan: DailyPlanSummary;
  onRegenerateMeal?: (date: string, mealType: MealType) => void;
  isRegenerating?: boolean;
  targetCalories?: number;
}

export function DayPlanCard({
  dayPlan,
  onRegenerateMeal,
  isRegenerating = false,
  targetCalories,
}: DayPlanCardProps) {
  const caloriesDeviation = targetCalories
    ? dayPlan.totals.calories - targetCalories
    : 0;
  const isOverTarget = caloriesDeviation > 100;
  const isUnderTarget = caloriesDeviation < -100;

  return (
    <Card className="overflow-hidden">
      {/* Day Header */}
      <div className="p-3 bg-gradient-to-r from-neutral-50 to-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-neutral-800">{dayPlan.dayOfWeek}</h3>
            <p className="text-xs text-neutral-500">
              {new Date(dayPlan.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-lg font-bold',
                isOverTarget
                  ? 'text-amber-600'
                  : isUnderTarget
                  ? 'text-blue-600'
                  : 'text-green-600'
              )}
            >
              {dayPlan.totals.calories.toLocaleString()} cal
            </div>
            {targetCalories && (
              <p className="text-xs text-neutral-500">
                {caloriesDeviation > 0 ? '+' : ''}
                {caloriesDeviation.toLocaleString()} from target
              </p>
            )}
          </div>
        </div>

        {/* Macro Summary */}
        <div className="flex gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-neutral-600">{dayPlan.totals.protein}g protein</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-neutral-600">{dayPlan.totals.carbs}g carbs</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-neutral-600">{dayPlan.totals.fat}g fat</span>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="divide-y">
        {dayPlan.meals.map((meal) => (
          <MealEntryCard
            key={`${meal.date}-${meal.mealType}`}
            meal={meal}
            onRegenerate={
              onRegenerateMeal
                ? () => onRegenerateMeal(meal.date, meal.mealType)
                : undefined
            }
            isRegenerating={isRegenerating}
          />
        ))}
      </div>
    </Card>
  );
}

interface MealEntryCardProps {
  meal: GeneratedMealEntry;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

function MealEntryCard({ meal, onRegenerate, isRegenerating }: MealEntryCardProps) {
  const mealTypeLabels: Record<string, { label: string; emoji: string }> = {
    breakfast: { label: 'Breakfast', emoji: '🌅' },
    lunch: { label: 'Lunch', emoji: '☀️' },
    dinner: { label: 'Dinner', emoji: '🌙' },
    snack: { label: 'Snack', emoji: '🍿' },
  };

  const mealInfo = mealTypeLabels[meal.mealType] || { label: meal.mealType, emoji: '🍽️' };

  return (
    <div className="p-3 hover:bg-neutral-50 transition-colors">
      <div className="flex gap-3">
        {/* Image */}
        <div className="w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
          {meal.imageUrl ? (
            <img
              src={getImageUrl(meal.imageUrl)}
              alt={meal.recipeTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {mealInfo.emoji}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500 uppercase">
                  {mealInfo.label}
                </span>
                {meal.isExisting ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                    <Check className="w-3 h-3" />
                    Your Recipe
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                    <Sparkles className="w-3 h-3" />
                    AI Suggestion
                  </span>
                )}
              </div>
              <h4 className="font-medium text-neutral-800 truncate">{meal.recipeTitle}</h4>
            </div>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50"
                title="Swap meal"
              >
                <RefreshCw
                  className={cn('w-4 h-4 text-neutral-400', isRegenerating && 'animate-spin')}
                />
              </button>
            )}
          </div>

          {/* Nutrition Info */}
          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
            <span>{meal.servings} servings</span>
            {meal.hasNutritionData ? (
              <>
                <span>{meal.estimatedCalories || 0} cal</span>
                <span>{meal.estimatedProtein || 0}g P</span>
              </>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                No nutrition data
              </span>
            )}
          </div>

          {/* AI Suggestion Details */}
          {meal.suggestedRecipe && (
            <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
              <p className="text-purple-700 font-medium mb-1">
                {meal.suggestedRecipe.description}
              </p>
              {meal.suggestedRecipe.estimatedPrepTime && (
                <div className="flex items-center gap-1 text-purple-600">
                  <Clock className="w-3 h-3" />
                  ~{meal.suggestedRecipe.estimatedPrepTime + (meal.suggestedRecipe.estimatedCookTime || 0)} min
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DayPlanCard;
