import { useState } from 'react';
import { Loader2, ShoppingCart, RefreshCw, Check, Package } from 'lucide-react';
import { Button, Card } from '../ui';
import { useToast } from '../ui';
import {
  useEventShoppingList,
  useGenerateShoppingList,
  useToggleShoppingItem,
} from '../../hooks/usePartyEvents';
import { cn } from '../../lib/utils';

interface EventShoppingListProps {
  eventId: string;
  recipeCount: number;
}

export function EventShoppingList({ eventId, recipeCount }: EventShoppingListProps) {
  const toast = useToast();
  const { data: shoppingList, isLoading } = useEventShoppingList(eventId);
  const generateList = useGenerateShoppingList();
  const toggleItem = useToggleShoppingItem();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    try {
      const result = await generateList.mutateAsync(eventId);
      toast.success(`Shopping list created with ${result.itemCount} items`);
    } catch {
      toast.error('Failed to generate shopping list');
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      await toggleItem.mutateAsync({ eventId, itemId });
    } catch {
      toast.error('Failed to update item');
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  // No shopping list exists yet
  if (!shoppingList) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
        <h3 className="text-lg font-medium text-neutral-700 mb-2">No Shopping List Yet</h3>
        <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
          {recipeCount > 0
            ? `Generate a shopping list from your ${recipeCount} pinned recipe${recipeCount > 1 ? 's' : ''} to see all the ingredients you'll need.`
            : 'Add some recipes to this event first, then generate a shopping list.'}
        </p>
        {recipeCount > 0 && (
          <Button onClick={handleGenerate} disabled={generateList.isPending}>
            {generateList.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Generate Shopping List
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  const progress = shoppingList.itemCount > 0
    ? Math.round((shoppingList.checkedCount / shoppingList.itemCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-neutral-800">
            Shopping List
          </h3>
          <p className="text-sm text-neutral-500">
            {shoppingList.checkedCount} of {shoppingList.itemCount} items checked
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateList.isPending}
          title="Regenerate list from current recipes"
        >
          {generateList.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {shoppingList.categories.map((category) => {
          const categoryChecked = category.items.filter((i) => i.isChecked).length;
          const isExpanded = expandedCategories.has(category.name);
          const allChecked = categoryChecked === category.items.length;

          return (
            <Card key={category.name} className="overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category.name)}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className={cn(
                    'w-5 h-5',
                    allChecked ? 'text-green-500' : 'text-neutral-400'
                  )} />
                  <span className="font-medium text-neutral-800">
                    {category.name}
                  </span>
                  <span className="text-sm text-neutral-500">
                    ({categoryChecked}/{category.items.length})
                  </span>
                </div>
                <svg
                  className={cn(
                    'w-5 h-5 text-neutral-400 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="border-t divide-y">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 transition-colors',
                        item.isChecked ? 'bg-green-50/50' : 'hover:bg-neutral-50'
                      )}
                    >
                      <button
                        onClick={() => handleToggleItem(item.id)}
                        disabled={toggleItem.isPending}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          item.isChecked
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-neutral-300 hover:border-green-400'
                        )}
                      >
                        {item.isChecked && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1">
                        <span
                          className={cn(
                            'text-neutral-800',
                            item.isChecked && 'line-through text-neutral-400'
                          )}
                        >
                          {item.ingredient}
                        </span>
                        {(item.quantity || item.unit) && (
                          <span className="text-neutral-500 ml-2">
                            {item.quantity ? formatQuantity(item.quantity) : ''}
                            {item.unit ? ` ${item.unit}` : ''}
                          </span>
                        )}
                      </div>
                      {item.assignedTo && (
                        <span
                          className="text-sm bg-neutral-100 px-2 py-1 rounded"
                          title={item.assignedTo.name}
                        >
                          {item.assignedTo.avatarEmoji || '👤'} {item.assignedTo.name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Completion message */}
      {progress === 100 && (
        <div className="text-center py-6 bg-green-50 rounded-xl">
          <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <h4 className="text-lg font-medium text-green-700">All done!</h4>
          <p className="text-sm text-green-600">You've checked off all items on the list.</p>
        </div>
      )}
    </div>
  );
}

function formatQuantity(qty: number): string {
  if (qty === Math.floor(qty)) {
    return qty.toString();
  }
  // Format fractions nicely
  const fractions: Record<number, string> = {
    0.25: '1/4',
    0.33: '1/3',
    0.5: '1/2',
    0.66: '2/3',
    0.75: '3/4',
  };
  const decimal = qty - Math.floor(qty);
  const rounded = Math.round(decimal * 100) / 100;
  const fraction = fractions[rounded];

  if (fraction) {
    return Math.floor(qty) > 0 ? `${Math.floor(qty)} ${fraction}` : fraction;
  }
  return qty.toFixed(2).replace(/\.?0+$/, '');
}

export default EventShoppingList;
