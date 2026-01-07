import { ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { useState } from 'react';
import type { IngredientBreakdownItem } from '../../services/recipe.service';

interface IngredientBreakdownProps {
  breakdown: IngredientBreakdownItem[];
  className?: string;
}

// Get color based on calorie percentage contribution
function getCalorieColor(percentage: number): string {
  if (percentage >= 30) return 'bg-rose-500';
  if (percentage >= 20) return 'bg-orange-500';
  if (percentage >= 10) return 'bg-amber-500';
  return 'bg-green-500';
}

// Get dominant macro for color coding
function getDominantMacro(item: IngredientBreakdownItem): 'protein' | 'carbs' | 'fat' {
  const proteinCals = item.protein * 4;
  const carbsCals = item.carbs * 4;
  const fatCals = item.fat * 9;

  if (proteinCals >= carbsCals && proteinCals >= fatCals) return 'protein';
  if (carbsCals >= proteinCals && carbsCals >= fatCals) return 'carbs';
  return 'fat';
}

function getMacroColor(macro: 'protein' | 'carbs' | 'fat'): string {
  switch (macro) {
    case 'protein':
      return 'text-blue-600';
    case 'carbs':
      return 'text-amber-600';
    case 'fat':
      return 'text-rose-600';
  }
}

function getMacroBgColor(macro: 'protein' | 'carbs' | 'fat'): string {
  switch (macro) {
    case 'protein':
      return 'bg-blue-100';
    case 'carbs':
      return 'bg-amber-100';
    case 'fat':
      return 'bg-rose-100';
  }
}

export function IngredientBreakdown({ breakdown, className = '' }: IngredientBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!breakdown || breakdown.length === 0) {
    return null;
  }

  // Sort by calories (descending) and take top items for preview
  const sortedBreakdown = [...breakdown].sort((a, b) => b.calories - a.calories);
  const previewItems = sortedBreakdown.slice(0, 3);
  const hasMore = sortedBreakdown.length > 3;

  return (
    <div className={`border-t border-neutral-100 pt-4 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div>
          <p className="text-sm font-medium text-neutral-700">Ingredient Breakdown</p>
          <p className="text-xs text-neutral-400">
            See how each ingredient contributes to the total
          </p>
        </div>
        <div className="p-1 rounded-lg group-hover:bg-neutral-100 transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </button>

      {/* Collapsed preview */}
      {!isExpanded && (
        <div className="mt-3 space-y-2">
          {previewItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className={`h-2 rounded-full ${getCalorieColor(item.percentageOfCalories)}`}
                style={{ width: `${Math.max(item.percentageOfCalories, 5)}%` }}
              />
              <span className="text-xs text-neutral-500 truncate flex-1">
                {item.ingredient}
              </span>
              <span className="text-xs font-medium text-neutral-700">
                {item.percentageOfCalories}%
              </span>
            </div>
          ))}
          {hasMore && (
            <p className="text-xs text-neutral-400 text-center">
              +{sortedBreakdown.length - 3} more ingredients
            </p>
          )}
        </div>
      )}

      {/* Expanded full list */}
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {sortedBreakdown.map((item, idx) => {
            const dominantMacro = getDominantMacro(item);
            return (
              <div
                key={idx}
                className="p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 truncate">
                      {item.ingredient}
                    </p>
                    {item.quantity && (
                      <p className="text-xs text-neutral-500">{item.quantity}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-sm font-semibold text-neutral-800">
                      {item.calories}
                    </span>
                    <span className="text-xs text-neutral-400">cal</span>
                  </div>
                </div>

                {/* Calorie contribution bar */}
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getCalorieColor(item.percentageOfCalories)}`}
                        style={{ width: `${item.percentageOfCalories}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-neutral-600 w-10 text-right">
                      {item.percentageOfCalories}%
                    </span>
                  </div>
                </div>

                {/* Macro breakdown */}
                <div className="flex gap-3 text-xs">
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      dominantMacro === 'protein' ? getMacroBgColor('protein') : 'bg-neutral-100'
                    }`}
                  >
                    <span className={getMacroColor('protein')}>P:</span>
                    <span className="text-neutral-700">{item.protein}g</span>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      dominantMacro === 'carbs' ? getMacroBgColor('carbs') : 'bg-neutral-100'
                    }`}
                  >
                    <span className={getMacroColor('carbs')}>C:</span>
                    <span className="text-neutral-700">{item.carbs}g</span>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      dominantMacro === 'fat' ? getMacroBgColor('fat') : 'bg-neutral-100'
                    }`}
                  >
                    <span className={getMacroColor('fat')}>F:</span>
                    <span className="text-neutral-700">{item.fat}g</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
