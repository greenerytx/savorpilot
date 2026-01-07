import { useState, useEffect } from 'react';
import { X, Search, Clock, Users, Loader2, ShieldCheck } from 'lucide-react';
import { Button, Input, Card } from '../ui';
import { useRecipes } from '../../hooks';
import { useCompatibleRecipes } from '../../hooks/useRecipeCompatibility';
import { MealType } from '../../services/meal-planning.service';
import { getImageUrl, cn } from '../../lib/utils';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (recipeId: string, mealType: MealType, servings: number) => void;
  date: string;
  circleId?: string;
  defaultServings?: number;
}

export function AddMealModal({
  isOpen,
  onClose,
  onAdd,
  date,
  circleId,
  defaultServings = 4,
}: AddMealModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MealType.DINNER);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [servings, setServings] = useState(defaultServings);

  // Fetch recipes - use compatible recipes if circleId is provided
  const { data: allRecipes, isLoading: loadingAll } = useRecipes(
    circleId ? undefined : { limit: 50, search: searchQuery || undefined }
  );
  const { data: compatibleRecipes, isLoading: loadingCompatible } = useCompatibleRecipes(
    circleId,
    { limit: 50, search: searchQuery || undefined }
  );

  const isLoading = circleId ? loadingCompatible : loadingAll;
  const recipes = circleId ? compatibleRecipes?.data : allRecipes?.data;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedRecipeId(null);
      setServings(defaultServings);
    }
  }, [isOpen, defaultServings]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (selectedRecipeId) {
      onAdd(selectedRecipeId, selectedMealType, servings);
      onClose();
    }
  };

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const mealTypes = [
    { value: MealType.BREAKFAST, label: 'Breakfast', emoji: '🌅' },
    { value: MealType.LUNCH, label: 'Lunch', emoji: '☀️' },
    { value: MealType.DINNER, label: 'Dinner', emoji: '🌙' },
    { value: MealType.SNACK, label: 'Snack', emoji: '🍿' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">Add Meal</h2>
            <p className="text-sm text-neutral-500">{formattedDate}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Meal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Meal Type
            </label>
            <div className="flex gap-2">
              {mealTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedMealType(type.value)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                    selectedMealType === type.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  )}
                >
                  <span className="mr-1">{type.emoji}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Servings */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Servings
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-lg font-medium"
              >
                -
              </button>
              <span className="w-12 text-center text-lg font-medium">{servings}</span>
              <button
                onClick={() => setServings(servings + 1)}
                className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-lg font-medium"
              >
                +
              </button>
              <span className="text-sm text-neutral-500 ml-2">servings</span>
            </div>
          </div>

          {/* Recipe Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Recipe
              {circleId && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600">
                  <ShieldCheck className="w-3 h-3" />
                  Showing compatible recipes
                </span>
              )}
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Recipe List */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : recipes && recipes.length > 0 ? (
                <div className="divide-y">
                  {recipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => setSelectedRecipeId(recipe.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 text-left transition-colors',
                        selectedRecipeId === recipe.id
                          ? 'bg-primary-50 border-l-4 border-primary-500'
                          : 'hover:bg-neutral-50'
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                        {recipe.imageUrl ? (
                          <img
                            src={getImageUrl(recipe.imageUrl)}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            🍽️
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-800 truncate">
                          {recipe.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          {(recipe.prepTimeMinutes || recipe.cookTimeMinutes) && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {recipe.servings} servings
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500">
                  No recipes found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-neutral-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedRecipeId}>
            Add to Plan
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AddMealModal;
