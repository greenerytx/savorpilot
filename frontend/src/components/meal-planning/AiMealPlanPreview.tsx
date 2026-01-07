import { X, Check, AlertTriangle, TrendingUp, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { Button, Card } from '../ui';
import { DayPlanCard } from './DayPlanCard';
import type {
  GeneratedMealPlanPreview,
  MealType,
} from '../../services/meal-planning.service';
import { cn } from '../../lib/utils';

interface AiMealPlanPreviewProps {
  preview: GeneratedMealPlanPreview;
  onApply: () => void;
  onClose: () => void;
  onRegenerateMeal: (date: string, mealType: MealType) => void;
  isApplying?: boolean;
  isRegenerating?: boolean;
  targetCalories?: number;
}

export function AiMealPlanPreview({
  preview,
  onApply,
  onClose,
  onRegenerateMeal,
  isApplying = false,
  isRegenerating = false,
  targetCalories,
}: AiMealPlanPreviewProps) {
  const { statistics, weeklyAverages, warnings } = preview;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl my-8">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">Generated Meal Plan</h2>
            <p className="text-sm text-neutral-500">
              {preview.startDate} to {preview.endDate} ({preview.durationDays} days)
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isApplying}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Notes</h4>
                  <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                    {warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
              label="Daily Average"
              value={`${weeklyAverages.caloriesPerDay.toLocaleString()} cal`}
              subValue={targetCalories ? `Target: ${targetCalories.toLocaleString()}` : undefined}
            />
            <StatCard
              icon={<div className="w-5 h-5 rounded-full bg-red-400" />}
              label="Protein/Day"
              value={`${weeklyAverages.proteinPerDay}g`}
            />
            <StatCard
              icon={<BookOpen className="w-5 h-5 text-primary-500" />}
              label="Your Recipes"
              value={statistics.existingRecipesUsed.toString()}
              subValue={`${statistics.recipesWithNutrition} with nutrition`}
            />
            <StatCard
              icon={<Sparkles className="w-5 h-5 text-purple-500" />}
              label="AI Suggestions"
              value={statistics.newRecipesSuggested.toString()}
            />
          </div>

          {/* Macro Averages */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Daily Macro Averages</h3>
            <div className="grid grid-cols-3 gap-4">
              <MacroBar
                label="Protein"
                value={weeklyAverages.proteinPerDay}
                color="bg-red-400"
              />
              <MacroBar
                label="Carbs"
                value={weeklyAverages.carbsPerDay}
                color="bg-blue-400"
              />
              <MacroBar
                label="Fat"
                value={weeklyAverages.fatPerDay}
                color="bg-yellow-400"
              />
            </div>
          </Card>

          {/* Day Cards Grid */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">Daily Breakdown</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preview.dailyPlans.map((dayPlan) => (
                <DayPlanCard
                  key={dayPlan.date}
                  dayPlan={dayPlan}
                  onRegenerateMeal={onRegenerateMeal}
                  isRegenerating={isRegenerating}
                  targetCalories={targetCalories}
                />
              ))}
            </div>
          </div>

          {/* Cuisine Breakdown */}
          {statistics.cuisineBreakdown && Object.keys(statistics.cuisineBreakdown).length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Cuisine Variety</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statistics.cuisineBreakdown).map(([cuisine, count]) => (
                  <span
                    key={cuisine}
                    className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                  >
                    {cuisine}: {count}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between p-4 border-t bg-white rounded-b-2xl">
          <div className="text-sm text-neutral-500">
            <span className="font-medium text-neutral-700">{statistics.existingRecipesUsed}</span> of your recipes
            {statistics.newRecipesSuggested > 0 && (
              <span>
                {' + '}
                <span className="font-medium text-purple-600">{statistics.newRecipesSuggested}</span> AI suggestions
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isApplying}>
              Cancel
            </Button>
            <Button onClick={onApply} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Apply to Meal Plan
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

function StatCard({ icon, label, value, subValue }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-neutral-500 uppercase">{label}</span>
      </div>
      <div className="text-2xl font-bold text-neutral-800">{value}</div>
      {subValue && <div className="text-xs text-neutral-500 mt-1">{subValue}</div>}
    </Card>
  );
}

interface MacroBarProps {
  label: string;
  value: number;
  color: string;
}

function MacroBar({ label, value, color }: MacroBarProps) {
  // Normalize to a percentage (assuming max of ~300g for visual)
  const percentage = Math.min((value / 300) * 100, 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-neutral-600">{label}</span>
        <span className="font-medium text-neutral-800">{value}g</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default AiMealPlanPreview;
