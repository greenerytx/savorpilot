import { useState, useEffect } from 'react';
import { X, Wand2, Loader2, Calendar, Target, Users, Utensils, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../ui';
import { MealType } from '../../services/meal-planning.service';
import type { GenerateMealPlanRequest } from '../../services/meal-planning.service';
import { cn } from '../../lib/utils';

interface Circle {
  id: string;
  name: string;
  emoji?: string;
  memberCount?: number;
}

interface AiMealPlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (request: GenerateMealPlanRequest) => Promise<void>;
  isLoading?: boolean;
  error?: Error | null;
  circles?: Circle[];
  defaultStartDate?: string;
}

export function AiMealPlanGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  isLoading = false,
  error,
  circles = [],
  defaultStartDate,
}: AiMealPlanGeneratorModalProps) {
  // Form state
  const [startDate, setStartDate] = useState(defaultStartDate || new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(7);
  const [targetCalories, setTargetCalories] = useState<number | undefined>(2000);
  const [enableMacros, setEnableMacros] = useState(false);
  const [proteinTarget, setProteinTarget] = useState<number | undefined>(100);
  const [carbsTarget, setCarbsTarget] = useState<number | undefined>(250);
  const [fatTarget, setFatTarget] = useState<number | undefined>(65);
  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([
    MealType.BREAKFAST,
    MealType.LUNCH,
    MealType.DINNER,
  ]);
  const [selectedCircleId, setSelectedCircleId] = useState<string | undefined>();
  const [useCircleRestrictions, setUseCircleRestrictions] = useState(true);
  const [servingsPerMeal, setServingsPerMeal] = useState(4);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      if (defaultStartDate) {
        setStartDate(defaultStartDate);
      }
    }
  }, [isOpen, defaultStartDate]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const request: GenerateMealPlanRequest = {
      startDate,
      durationDays,
      targetCalories,
      mealTypes: selectedMealTypes,
      servingsPerMeal,
    };

    if (enableMacros) {
      request.macroTargets = {
        protein: proteinTarget,
        carbs: carbsTarget,
        fat: fatTarget,
      };
    }

    if (selectedCircleId) {
      request.circleId = selectedCircleId;
      request.useCircleRestrictions = useCircleRestrictions;
    }

    await onGenerate(request);
  };

  const toggleMealType = (mealType: MealType) => {
    setSelectedMealTypes((prev) =>
      prev.includes(mealType)
        ? prev.filter((t) => t !== mealType)
        : [...prev, mealType]
    );
  };

  const mealTypeOptions = [
    { value: MealType.BREAKFAST, label: 'Breakfast', emoji: '🌅' },
    { value: MealType.LUNCH, label: 'Lunch', emoji: '☀️' },
    { value: MealType.DINNER, label: 'Dinner', emoji: '🌙' },
    { value: MealType.SNACK, label: 'Snack', emoji: '🍿' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary-50 to-secondary-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Wand2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">AI Meal Plan Generator</h2>
              <p className="text-sm text-neutral-500">Create a personalized meal plan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          )}

          {/* Date & Duration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Calendar className="w-4 h-4" />
              Date Range
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Duration</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {[3, 5, 7, 10, 14].map((days) => (
                    <option key={days} value={days}>
                      {days} days
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Nutrition Goals */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Target className="w-4 h-4" />
              Nutrition Goals
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Daily Calories (optional)</label>
              <Input
                type="number"
                value={targetCalories || ''}
                onChange={(e) => setTargetCalories(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g., 2000"
                min={500}
                max={10000}
              />
            </div>

            {/* Macro Targets Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableMacros"
                checked={enableMacros}
                onChange={(e) => setEnableMacros(e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="enableMacros" className="text-sm text-neutral-700">
                Set macro targets
              </label>
            </div>

            {enableMacros && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-50 rounded-lg">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Protein (g)</label>
                  <Input
                    type="number"
                    value={proteinTarget || ''}
                    onChange={(e) => setProteinTarget(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="100"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Carbs (g)</label>
                  <Input
                    type="number"
                    value={carbsTarget || ''}
                    onChange={(e) => setCarbsTarget(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="250"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Fat (g)</label>
                  <Input
                    type="number"
                    value={fatTarget || ''}
                    onChange={(e) => setFatTarget(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="65"
                    min={0}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Meal Types */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Utensils className="w-4 h-4" />
              Meals to Plan
            </div>
            <div className="flex flex-wrap gap-2">
              {mealTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleMealType(option.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedMealTypes.includes(option.value)
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  <span className="mr-1">{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>
            {selectedMealTypes.length === 0 && (
              <p className="text-xs text-amber-600">Please select at least one meal type</p>
            )}
          </div>

          {/* Servings */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              Servings per Meal
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setServingsPerMeal(Math.max(1, servingsPerMeal - 1))}
                className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-lg font-medium"
              >
                -
              </button>
              <span className="w-12 text-center text-lg font-semibold">{servingsPerMeal}</span>
              <button
                onClick={() => setServingsPerMeal(Math.min(20, servingsPerMeal + 1))}
                className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-lg font-medium"
              >
                +
              </button>
              <span className="text-sm text-neutral-500">servings</span>
            </div>
          </div>

          {/* Dinner Circle Filter */}
          {circles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Users className="w-4 h-4" />
                Dietary Restrictions
              </div>
              <select
                value={selectedCircleId || ''}
                onChange={(e) => setSelectedCircleId(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">No dietary filtering</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.emoji || '👥'} {circle.name}
                    {circle.memberCount ? ` (${circle.memberCount} members)` : ''}
                  </option>
                ))}
              </select>

              {selectedCircleId && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCircleRestrictions"
                    checked={useCircleRestrictions}
                    onChange={(e) => setUseCircleRestrictions(e.target.checked)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="useCircleRestrictions" className="text-sm text-neutral-700">
                    Only show recipes compatible with circle members' dietary needs
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t bg-neutral-50">
          <p className="text-xs text-neutral-500">
            AI will use your recipes and suggest new ones for variety
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || selectedMealTypes.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Plan
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiMealPlanGeneratorModal;
