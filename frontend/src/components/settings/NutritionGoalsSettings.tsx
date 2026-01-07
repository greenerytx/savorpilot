import { useState, useEffect } from 'react';
import { Save, Loader2, Flame, Target, Check } from 'lucide-react';
import { Button, Card, Input, useToast } from '../ui';
import {
  useNutritionGoals,
  useUpdateNutritionGoals,
  useApplyNutritionPreset,
} from '../../hooks/useNutritionGoals';
import {
  PRESET_METADATA,
  type NutritionPresetKey,
} from '../../services/nutrition-goals.service';

const PRESETS: {
  key: NutritionPresetKey;
  label: string;
  description: string;
  calories: number;
}[] = [
  { key: 'weightLoss', ...PRESET_METADATA.weightLoss, calories: 1500 },
  { key: 'maintenance', ...PRESET_METADATA.maintenance, calories: 2000 },
  { key: 'muscleGain', ...PRESET_METADATA.muscleGain, calories: 2500 },
  { key: 'lowCarb', ...PRESET_METADATA.lowCarb, calories: 1800 },
];

export function NutritionGoalsSettings() {
  const toast = useToast();
  const { data: goals, isLoading } = useNutritionGoals();
  const updateGoals = useUpdateNutritionGoals();
  const applyPreset = useApplyNutritionPreset();

  // Form state
  const [dailyCalories, setDailyCalories] = useState(2000);
  const [dailyProteinG, setDailyProteinG] = useState(50);
  const [dailyCarbsG, setDailyCarbsG] = useState(275);
  const [dailyFatG, setDailyFatG] = useState(78);
  const [dailyFiberG, setDailyFiberG] = useState<number | undefined>(25);
  const [dailySodiumMg, setDailySodiumMg] = useState<number | undefined>(2300);

  // Initialize form from fetched goals
  useEffect(() => {
    if (goals) {
      setDailyCalories(goals.dailyCalories);
      setDailyProteinG(goals.dailyProteinG);
      setDailyCarbsG(goals.dailyCarbsG);
      setDailyFatG(goals.dailyFatG);
      setDailyFiberG(goals.dailyFiberG ?? undefined);
      setDailySodiumMg(goals.dailySodiumMg ?? undefined);
    }
  }, [goals]);

  const handleSave = async () => {
    try {
      await updateGoals.mutateAsync({
        dailyCalories,
        dailyProteinG,
        dailyCarbsG,
        dailyFatG,
        dailyFiberG,
        dailySodiumMg,
      });
      toast.success('Nutrition goals updated');
    } catch {
      toast.error('Failed to save nutrition goals');
    }
  };

  const handleApplyPreset = async (presetKey: NutritionPresetKey) => {
    try {
      await applyPreset.mutateAsync(presetKey);
      toast.success(`Applied ${PRESET_METADATA[presetKey].label} preset`);
    } catch {
      toast.error('Failed to apply preset');
    }
  };

  // Calculate macro percentages
  const totalMacroCalories =
    dailyProteinG * 4 + dailyCarbsG * 4 + dailyFatG * 9;
  const proteinPercent = Math.round((dailyProteinG * 4 / dailyCalories) * 100);
  const carbsPercent = Math.round((dailyCarbsG * 4 / dailyCalories) * 100);
  const fatPercent = Math.round((dailyFatG * 9 / dailyCalories) * 100);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-2">
        Nutrition Goals
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        Set your daily nutrition targets to track progress in meal planning
      </p>

      {/* Presets */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-neutral-700 mb-3">
          Quick Presets
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map((preset) => {
            const isActive = goals?.dailyCalories === preset.calories;
            return (
              <button
                key={preset.key}
                onClick={() => handleApplyPreset(preset.key)}
                disabled={applyPreset.isPending}
                className={`relative p-4 rounded-xl border text-start transition-all ${
                  isActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 end-2">
                    <Check className="w-4 h-4 text-primary-500" />
                  </div>
                )}
                <div className="font-medium text-neutral-900">
                  {preset.label}
                </div>
                <div className="text-sm text-neutral-500 mt-1">
                  {preset.description}
                </div>
                <div className="text-xs text-primary-600 mt-2">
                  {preset.calories.toLocaleString()} cal/day
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Goals Form */}
      <div className="space-y-6">
        <h3 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Custom Goals
        </h3>

        {/* Calories */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            <Flame className="w-4 h-4 inline me-2 text-orange-500" />
            Daily Calories
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={dailyCalories}
              onChange={(e) => setDailyCalories(parseInt(e.target.value) || 0)}
              min={500}
              max={10000}
              className="w-32"
            />
            <span className="text-sm text-neutral-500">kcal/day</span>
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Protein
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={dailyProteinG}
                onChange={(e) => setDailyProteinG(parseInt(e.target.value) || 0)}
                min={0}
                max={500}
                className="w-20"
              />
              <span className="text-sm text-neutral-500">g</span>
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {proteinPercent}% of calories
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Carbs
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={dailyCarbsG}
                onChange={(e) => setDailyCarbsG(parseInt(e.target.value) || 0)}
                min={0}
                max={1000}
                className="w-20"
              />
              <span className="text-sm text-neutral-500">g</span>
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {carbsPercent}% of calories
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Fat
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={dailyFatG}
                onChange={(e) => setDailyFatG(parseInt(e.target.value) || 0)}
                min={0}
                max={500}
                className="w-20"
              />
              <span className="text-sm text-neutral-500">g</span>
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {fatPercent}% of calories
            </div>
          </div>
        </div>

        {/* Macro bar visualization */}
        <div className="bg-neutral-100 rounded-full h-3 overflow-hidden flex">
          <div
            className="bg-blue-500 h-full transition-all"
            style={{ width: `${proteinPercent}%` }}
            title={`Protein: ${proteinPercent}%`}
          />
          <div
            className="bg-amber-500 h-full transition-all"
            style={{ width: `${carbsPercent}%` }}
            title={`Carbs: ${carbsPercent}%`}
          />
          <div
            className="bg-purple-500 h-full transition-all"
            style={{ width: `${fatPercent}%` }}
            title={`Fat: ${fatPercent}%`}
          />
        </div>
        <div className="flex justify-center gap-6 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Protein
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Carbs
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Fat
          </span>
        </div>

        {/* Optional micronutrients */}
        <div className="pt-4 border-t border-neutral-200">
          <h4 className="text-sm font-medium text-neutral-700 mb-3">
            Optional Targets
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">
                Fiber
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={dailyFiberG ?? ''}
                  onChange={(e) =>
                    setDailyFiberG(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  min={0}
                  max={100}
                  placeholder="25"
                  className="w-24"
                />
                <span className="text-sm text-neutral-500">g</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-600 mb-1">
                Sodium
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={dailySodiumMg ?? ''}
                  onChange={(e) =>
                    setDailySodiumMg(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  min={0}
                  max={10000}
                  placeholder="2300"
                  className="w-24"
                />
                <span className="text-sm text-neutral-500">mg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={updateGoals.isPending}
          >
            {updateGoals.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Goals
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
