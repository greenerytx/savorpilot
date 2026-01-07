import { Sparkles, Loader2, Flame, Beef, Wheat, Droplets, Apple, Cookie, Zap } from 'lucide-react';
import { Button, Card } from '../ui';
import type { NutritionEstimate, IngredientBreakdownItem } from '../../services/recipe.service';
import { IngredientBreakdown } from './IngredientBreakdown';

interface NutritionCardProps {
  nutrition?: {
    caloriesPerServing?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    fiberGrams?: number;
    sugarGrams?: number;
    sodiumMg?: number;
    saturatedFatGrams?: number;
    cholesterolMg?: number;
    isEstimated?: boolean;
    ingredientBreakdown?: IngredientBreakdownItem[];
  } | null;
  estimatedNutrition?: NutritionEstimate | null;
  onEstimate?: () => void;
  isEstimating?: boolean;
  servings?: number;
}

// Daily recommended values for percentage calculation
const DAILY_VALUES = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
  fiber: 28,
  sugar: 50,
  sodium: 2300,
};

// Circular progress component
function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  children: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-100"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Macro nutrient card component
function MacroCard({
  icon: Icon,
  label,
  value,
  unit,
  dailyValue,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  unit: string;
  dailyValue: number;
  color: string;
  bgColor: string;
}) {
  const percentage = value ? Math.round((value / dailyValue) * 100) : 0;

  return (
    <div className={`${bgColor} rounded-2xl p-4 relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-xl ${color} bg-white/80`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-neutral-500">{percentage}% DV</span>
      </div>
      <p className="text-2xl font-bold text-neutral-900 mt-3">
        {value ?? '--'}<span className="text-sm font-normal text-neutral-500 ml-1">{unit}</span>
      </p>
      <p className="text-sm text-neutral-600 mt-1">{label}</p>
      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: 'currentColor' }}
        />
      </div>
    </div>
  );
}

export function NutritionCard({
  nutrition,
  estimatedNutrition,
  onEstimate,
  isEstimating = false,
  servings = 1,
}: NutritionCardProps) {
  const data = nutrition || estimatedNutrition;
  // Check if data is AI-estimated (either from saved nutrition or local state)
  const isEstimated = nutrition?.isEstimated ?? (!nutrition && !!estimatedNutrition);

  if (!data) {
    // Empty state - hidden in print using data-print-hidden attribute
    return (
      <Card className="p-8" data-print-hidden="true">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-primary-500" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            No Nutrition Data Yet
          </h3>
          <p className="text-neutral-500 mb-6">
            Use AI to analyze the ingredients and estimate the nutritional content of this recipe.
          </p>
          <Button
            onClick={onEstimate}
            disabled={isEstimating}
            size="lg"
            className="gap-2"
          >
            {isEstimating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Ingredients...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Estimate Nutrition with AI
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  const calories = data.caloriesPerServing ?? 0;
  const protein = data.proteinGrams ?? 0;
  const carbs = data.carbsGrams ?? 0;
  const fat = data.fatGrams ?? 0;

  // Calculate macro percentages by calories
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals;

  const proteinPct = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0;
  const carbsPct = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0;
  const fatPct = totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0;

  return (
    <Card className="p-6 bg-white">
    {/* Print-friendly Nutrition Facts Label (FDA style - COMPACT) */}
    <div className="hidden print:block border border-black p-2 max-w-[6cm] text-[7pt] font-sans">
      <div className="text-[10pt] font-extrabold leading-none border-b-2 border-black pb-0.5 mb-0.5">Nutrition Facts</div>
      <div className="text-[6pt] border-b border-black pb-0.5">Per serving ({servings} servings)</div>

      <div className="flex justify-between border-b-2 border-black py-0.5">
        <span className="text-[9pt] font-extrabold">Calories</span>
        <span className="text-[9pt] font-extrabold">{calories}</span>
      </div>

      <div className="flex justify-between py-0.5 border-b border-black">
        <span><strong>Fat</strong> {fat}g</span>
        <span>{Math.round((fat / DAILY_VALUES.fat) * 100)}%</span>
      </div>
      <div className="flex justify-between py-0.5 border-b border-black">
        <span><strong>Carbs</strong> {carbs}g</span>
        <span>{Math.round((carbs / DAILY_VALUES.carbs) * 100)}%</span>
      </div>
      <div className="flex justify-between py-0.5 border-b-2 border-black">
        <span><strong>Protein</strong> {protein}g</span>
        <span>{Math.round((protein / DAILY_VALUES.protein) * 100)}%</span>
      </div>

      <div className="text-[5pt] mt-0.5 leading-tight">
        *DV based on 2,000 cal diet{isEstimated && '. AI-estimated.'}
      </div>
    </div>

    {/* Web version (hidden in print) */}
    <div className="space-y-6 print:hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Nutrition Facts</h3>
          <p className="text-sm text-neutral-500">Per serving ({servings} servings total)</p>
        </div>
        {isEstimated && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-purple-50 rounded-full">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-medium text-primary-700">AI Estimated</span>
          </div>
        )}
      </div>

      {/* Main calories display */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 overflow-hidden">
        <div className="flex items-center gap-6">
          <CircularProgress
            value={calories}
            max={DAILY_VALUES.calories}
            size={140}
            strokeWidth={10}
            color="#f97316"
          >
            <Flame className="w-6 h-6 text-orange-500 mb-1" />
            <span className="text-3xl font-bold text-neutral-900">{calories}</span>
            <span className="text-xs text-neutral-500">kcal</span>
          </CircularProgress>

          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Calorie Breakdown</p>
              <div className="flex h-3 rounded-full overflow-hidden bg-neutral-100">
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{ width: `${proteinPct}%` }}
                  title={`Protein: ${proteinPct}%`}
                />
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${carbsPct}%` }}
                  title={`Carbs: ${carbsPct}%`}
                />
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${fatPct}%` }}
                  title={`Fat: ${fatPct}%`}
                />
              </div>
            </div>

            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-neutral-600">Protein {proteinPct}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-neutral-600">Carbs {carbsPct}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-neutral-600">Fat {fatPct}%</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400">
              {Math.round((calories / DAILY_VALUES.calories) * 100)}% of daily recommended intake
            </p>
          </div>
        </div>
      </Card>

      {/* Macros grid */}
      <div className="grid grid-cols-3 gap-4">
        <MacroCard
          icon={Beef}
          label="Protein"
          value={protein}
          unit="g"
          dailyValue={DAILY_VALUES.protein}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MacroCard
          icon={Wheat}
          label="Carbohydrates"
          value={carbs}
          unit="g"
          dailyValue={DAILY_VALUES.carbs}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <MacroCard
          icon={Droplets}
          label="Fat"
          value={fat}
          unit="g"
          dailyValue={DAILY_VALUES.fat}
          color="text-rose-600"
          bgColor="bg-rose-50"
        />
      </div>

      {/* Additional nutrients */}
      {(data.fiberGrams !== undefined || data.sugarGrams !== undefined || data.sodiumMg !== undefined) && (
        <div className="pt-4 border-t border-neutral-100">
          <p className="text-sm font-medium text-neutral-700 mb-4">Additional Nutrients</p>
          <div className="grid grid-cols-3 gap-4">
            {data.fiberGrams !== undefined && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Apple className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-neutral-900">{data.fiberGrams}g</p>
                  <p className="text-xs text-neutral-500">Fiber</p>
                </div>
              </div>
            )}
            {data.sugarGrams !== undefined && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Cookie className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-neutral-900">{data.sugarGrams}g</p>
                  <p className="text-xs text-neutral-500">Sugar</p>
                </div>
              </div>
            )}
            {data.sodiumMg !== undefined && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <Zap className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-neutral-900">{data.sodiumMg}mg</p>
                  <p className="text-xs text-neutral-500">Sodium</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingredient Breakdown */}
      {data.ingredientBreakdown && data.ingredientBreakdown.length > 0 && (
        <IngredientBreakdown breakdown={data.ingredientBreakdown} />
      )}

      {/* Disclaimer */}
      <p className="text-xs text-neutral-400 text-center">
        * Percent Daily Values are based on a 2,000 calorie diet.
        {isEstimated && ' Values are AI-estimated and may vary.'}
      </p>

      {/* Re-estimate button if already estimated */}
      {isEstimated && onEstimate && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onEstimate}
            disabled={isEstimating}
          >
            {isEstimating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Re-estimating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Re-estimate Nutrition
              </>
            )}
          </Button>
        </div>
      )}
    </div>
    {/* End web version */}
    </Card>
  );
}
