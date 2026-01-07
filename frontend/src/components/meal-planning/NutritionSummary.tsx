import { useState } from 'react';
import { ChevronDown, ChevronUp, Flame, Beef, Wheat, Droplets, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { DailyNutritionCard } from './DailyNutritionCard';
import { useNutritionGoalsWithDefaults } from '../../hooks/useNutritionGoals';
import type { MealPlanNutritionSummary } from '../../services/meal-planning.service';
import { cn } from '../../lib/utils';

interface NutritionSummaryProps {
  nutrition: MealPlanNutritionSummary | undefined;
  isLoading?: boolean;
  className?: string;
}

// Get variance color based on how far from goal
function getVarianceColor(value: number, goal: number): string {
  const ratio = value / goal;
  if (ratio >= 0.9 && ratio <= 1.1) return 'text-green-600'; // Within 10%
  if (ratio >= 0.75 && ratio <= 1.25) return 'text-amber-600'; // Within 25%
  return 'text-red-600'; // Outside 25%
}

function getVarianceBgColor(value: number, goal: number): string {
  const ratio = value / goal;
  if (ratio >= 0.9 && ratio <= 1.1) return 'bg-green-500'; // Within 10%
  if (ratio >= 0.75 && ratio <= 1.25) return 'bg-amber-500'; // Within 25%
  return 'bg-red-500'; // Outside 25%
}

function MacroBar({
  label,
  value,
  dailyValue,
  color,
  icon: Icon,
  showVariance = false,
}: {
  label: string;
  value: number;
  dailyValue: number;
  color: string;
  icon: React.ElementType;
  showVariance?: boolean;
}) {
  const percentage = Math.min(Math.round((value / dailyValue) * 100), 100);
  const varianceColor = showVariance ? getVarianceColor(value, dailyValue) : '';
  const barColor = showVariance ? getVarianceBgColor(value, dailyValue) : color.replace('text-', 'bg-');

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Icon className={cn('w-4 h-4', color)} />
          <span className="text-neutral-600">{label}</span>
        </div>
        <span className={cn('font-medium', showVariance ? varianceColor : 'text-neutral-800')}>
          {value}g <span className="text-neutral-400 text-xs">/ {dailyValue}g ({percentage}%)</span>
        </span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function NutritionSummary({ nutrition, isLoading, className }: NutritionSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { goals } = useNutritionGoalsWithDefaults();

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center gap-2 text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading nutrition data...</span>
        </div>
      </Card>
    );
  }

  if (!nutrition) {
    return null;
  }

  const { weeklyTotals, averages, coverage, dailyBreakdown } = nutrition;
  const daysWithMeals = dailyBreakdown.length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-neutral-800">Weekly Nutrition</h3>
            <p className="text-sm text-neutral-500">
              {daysWithMeals} day{daysWithMeals !== 1 ? 's' : ''} planned
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-neutral-800">{averages.caloriesPerDay}</p>
            <p className="text-xs text-neutral-500">cal/day avg</p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </button>

      {/* Summary stats - always visible */}
      <div className="px-4 pb-4">
        {/* Coverage warning */}
        {coverage.coveragePercentage < 100 && (
          <div className="flex items-center gap-2 p-2 mb-3 bg-amber-50 rounded-lg text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {coverage.mealsWithNutrition} of {coverage.totalMeals} meals have nutrition data ({coverage.coveragePercentage}%)
            </span>
          </div>
        )}

        {/* Daily averages */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-orange-50 rounded-xl">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className={cn('text-lg font-bold', getVarianceColor(averages.caloriesPerDay, goals.dailyCalories))}>
              {averages.caloriesPerDay}
            </p>
            <p className="text-xs text-neutral-500">/ {goals.dailyCalories} cal</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <Beef className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className={cn('text-lg font-bold', getVarianceColor(averages.proteinPerDay, goals.dailyProteinG))}>
              {averages.proteinPerDay}g
            </p>
            <p className="text-xs text-neutral-500">/ {goals.dailyProteinG}g protein</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <Wheat className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className={cn('text-lg font-bold', getVarianceColor(averages.carbsPerDay, goals.dailyCarbsG))}>
              {averages.carbsPerDay}g
            </p>
            <p className="text-xs text-neutral-500">/ {goals.dailyCarbsG}g carbs</p>
          </div>
          <div className="text-center p-3 bg-rose-50 rounded-xl">
            <Droplets className="w-5 h-5 text-rose-500 mx-auto mb-1" />
            <p className={cn('text-lg font-bold', getVarianceColor(averages.fatPerDay, goals.dailyFatG))}>
              {averages.fatPerDay}g
            </p>
            <p className="text-xs text-neutral-500">/ {goals.dailyFatG}g fat</p>
          </div>
        </div>

        {/* Weekly totals breakdown */}
        <div className="space-y-3">
          <MacroBar
            label="Protein"
            value={Math.round(weeklyTotals.protein / Math.max(daysWithMeals, 1))}
            dailyValue={goals.dailyProteinG}
            color="text-blue-500"
            icon={Beef}
            showVariance
          />
          <MacroBar
            label="Carbs"
            value={Math.round(weeklyTotals.carbs / Math.max(daysWithMeals, 1))}
            dailyValue={goals.dailyCarbsG}
            color="text-amber-500"
            icon={Wheat}
            showVariance
          />
          <MacroBar
            label="Fat"
            value={Math.round(weeklyTotals.fat / Math.max(daysWithMeals, 1))}
            dailyValue={goals.dailyFatG}
            color="text-rose-500"
            icon={Droplets}
            showVariance
          />
        </div>
      </div>

      {/* Expanded daily breakdown */}
      {isExpanded && dailyBreakdown.length > 0 && (
        <div className="border-t">
          <div className="p-4 space-y-3">
            <h4 className="text-sm font-medium text-neutral-700">Daily Breakdown</h4>
            {dailyBreakdown.map((day) => (
              <DailyNutritionCard key={day.date} day={day} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default NutritionSummary;
