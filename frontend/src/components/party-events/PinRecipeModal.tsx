import { useState, useEffect } from 'react';
import { X, Search, Clock, Users, Loader2, ChefHat } from 'lucide-react';
import { Button, Input, Card } from '../ui';
import { useRecipes } from '../../hooks';
import { usePinRecipe, useEventOptions } from '../../hooks/usePartyEvents';
import { useToast } from '../ui';
import { getImageUrl, cn } from '../../lib/utils';

interface PinRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

export function PinRecipeModal({
  isOpen,
  onClose,
  eventId,
}: PinRecipeModalProps) {
  const toast = useToast();
  const { data: options } = useEventOptions();
  const pinRecipe = usePinRecipe();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [servings, setServings] = useState(4);
  const [notes, setNotes] = useState('');

  const { data: recipesData, isLoading } = useRecipes({
    limit: 50,
    search: searchQuery || undefined,
  });

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedRecipeId(null);
      setCategory('');
      setServings(4);
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedRecipeId) return;

    try {
      await pinRecipe.mutateAsync({
        eventId,
        dto: {
          recipeId: selectedRecipeId,
          category: category || undefined,
          servings,
          notes: notes.trim() || undefined,
        },
      });
      toast.success('Recipe added to event!');
      onClose();
    } catch {
      toast.error('Failed to add recipe');
    }
  };

  const categories = options?.categories || [
    'Appetizer',
    'Main Course',
    'Side Dish',
    'Dessert',
    'Beverage',
    'Other',
  ];

  const selectedRecipe = recipesData?.data?.find((r) => r.id === selectedRecipeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-neutral-800">Add Recipe to Event</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search your recipes..."
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
            ) : recipesData?.data && recipesData.data.length > 0 ? (
              <div className="divide-y">
                {recipesData.data.map((recipe) => (
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
                          <ChefHat className="w-6 h-6" />
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

          {/* Selected Recipe Options */}
          {selectedRecipeId && (
            <div className="space-y-4 pt-4 border-t">
              <div className="p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-700">
                  Selected: <span className="font-medium">{selectedRecipe?.title}</span>
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(category === cat ? '' : cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-colors',
                        category === cat
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      )}
                    >
                      {cat}
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
                    type="button"
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-lg font-medium"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-lg font-medium">{servings}</span>
                  <button
                    type="button"
                    onClick={() => setServings(servings + 1)}
                    className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-lg font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special notes about this dish..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-neutral-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedRecipeId || pinRecipe.isPending}
          >
            {pinRecipe.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to Event'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default PinRecipeModal;
