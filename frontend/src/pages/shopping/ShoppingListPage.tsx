import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Check,
  X,
  ShoppingCart,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button, Card, Input, useToast, UnitToggle } from '../../components/ui';
import {
  useShoppingLists,
  useShoppingList,
  useCreateShoppingList,
  useDeleteShoppingList,
  useAddShoppingItem,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearCheckedItems,
  useGenerateFromMealPlan,
} from '../../hooks/useShoppingLists';
import { useMealPlans } from '../../hooks/useMealPlanning';
import {
  getCategoryLabel,
  getCategoryEmoji,
  getCategoryOrder,
  aggregateShoppingItems,
} from '../../services/shopping.service';
import type { ShoppingListItem, AggregatedShoppingItem } from '../../services/shopping.service';
import { useUnitPreferencesStore, type UnitDisplaySystem } from '../../stores/unitPreferencesStore';
import { cn } from '../../lib/utils';

export function ShoppingListPage() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Unit conversion - default to 'original' to preserve original units
  const { setShoppingPageOverride } = useUnitPreferencesStore();
  const [unitDisplay, setUnitDisplay] = useState<UnitDisplaySystem>('original');

  // Check if we need to generate from meal plan
  const mealPlanId = searchParams.get('mealPlanId');

  // Fetch data
  const { data: listsData, isLoading: loadingLists } = useShoppingLists();
  const { data: selectedList, isLoading: loadingList } = useShoppingList(selectedListId || '');
  const { data: mealPlansData } = useMealPlans();

  // Mutations
  const createList = useCreateShoppingList();
  const deleteList = useDeleteShoppingList();
  const addItem = useAddShoppingItem();
  const toggleItem = useToggleShoppingItem();
  const deleteItem = useDeleteShoppingItem();
  const clearChecked = useClearCheckedItems();
  const generateFromMealPlan = useGenerateFromMealPlan();

  // Auto-select first list or handle meal plan generation
  useMemo(() => {
    if (mealPlanId && !selectedListId) {
      // Generate from meal plan
      generateFromMealPlan.mutate(
        { mealPlanId },
        {
          onSuccess: (list) => {
            setSelectedListId(list.id);
            toast.success('Shopping list generated!');
          },
          onError: () => {
            toast.error('Failed to generate shopping list');
          },
        }
      );
    } else if (!selectedListId && listsData?.data && listsData.data.length > 0) {
      setSelectedListId(listsData.data[0].id);
    }
  }, [listsData, selectedListId, mealPlanId]);

  // Group items by category with unit conversion aggregation
  const groupedItems = useMemo(() => {
    if (!selectedList?.groupedItems) return {};

    // First, flatten all items for aggregation
    const allItems: ShoppingListItem[] = Object.values(selectedList.groupedItems).flat();

    // Apply unit conversion and aggregation
    const aggregated = aggregateShoppingItems(
      allItems,
      unitDisplay === 'original' ? 'original' : unitDisplay
    );

    // Re-group by category
    const grouped: Record<string, AggregatedShoppingItem[]> = {};
    for (const item of aggregated) {
      const category = item.category || 'other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(item);
    }

    // Order by category preference
    const ordered: Record<string, AggregatedShoppingItem[]> = {};
    const categoryOrder = getCategoryOrder();

    for (const category of categoryOrder) {
      if (grouped[category]) {
        ordered[category] = grouped[category];
      }
    }

    // Add any categories not in the order
    for (const [category, items] of Object.entries(grouped)) {
      if (!ordered[category]) {
        ordered[category] = items;
      }
    }

    return ordered;
  }, [selectedList, unitDisplay]);

  // Handlers
  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      const list = await createList.mutateAsync({ name: newListName.trim() });
      setSelectedListId(list.id);
      setNewListName('');
      setShowNewListForm(false);
      toast.success('List created');
    } catch {
      toast.error('Failed to create list');
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteList.mutateAsync(id);
      if (selectedListId === id) {
        setSelectedListId(null);
      }
      toast.success('List deleted');
    } catch {
      toast.error('Failed to delete list');
    }
  };

  const handleAddItem = async () => {
    if (!selectedListId || !newItemName.trim()) return;

    try {
      await addItem.mutateAsync({
        listId: selectedListId,
        dto: { ingredient: newItemName.trim() },
      });
      setNewItemName('');
    } catch {
      toast.error('Failed to add item');
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (!selectedListId) return;

    try {
      await toggleItem.mutateAsync({ listId: selectedListId, itemId });
    } catch {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedListId) return;

    try {
      await deleteItem.mutateAsync({ listId: selectedListId, itemId });
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleClearChecked = async () => {
    if (!selectedListId) return;

    try {
      await clearChecked.mutateAsync(selectedListId);
      toast.success('Checked items cleared');
    } catch {
      toast.error('Failed to clear items');
    }
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const progress = selectedList
    ? Math.round(((selectedList.checkedCount || 0) / (selectedList.itemCount || 1)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">Shopping Lists</h1>
          <p className="text-primary-600">Manage your grocery shopping</p>
        </div>

        <div className="flex items-center gap-3">
          {mealPlansData?.data && mealPlansData.data.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    generateFromMealPlan.mutate(
                      { mealPlanId: e.target.value },
                      {
                        onSuccess: (list) => {
                          setSelectedListId(list.id);
                          toast.success('Shopping list generated!');
                        },
                      }
                    );
                    e.target.value = '';
                  }
                }}
                className="appearance-none pl-10 pr-8 py-2 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Generate from Meal Plan</option>
                {mealPlansData.data.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
            </div>
          )}

          <Button onClick={() => setShowNewListForm(true)}>
            <Plus className="w-4 h-4" />
            New List
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - List Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold text-neutral-800 mb-3">Your Lists</h2>

            {loadingLists ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : listsData?.data && listsData.data.length > 0 ? (
              <div className="space-y-2">
                {listsData.data.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                      selectedListId === list.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-neutral-100'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="font-medium truncate">{list.name}</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {list.checkedCount || 0}/{list.itemCount || 0}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-neutral-500 py-4">No lists yet</p>
            )}

            {/* New List Form */}
            {showNewListForm && (
              <div className="mt-4 pt-4 border-t">
                <Input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name..."
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleCreateList}
                    disabled={createList.isPending}
                  >
                    {createList.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Create'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewListForm(false);
                      setNewListName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Main Content - Selected List */}
        <div className="lg:col-span-3">
          {selectedListId ? (
            loadingList ? (
              <Card className="p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </Card>
            ) : selectedList ? (
              <Card className="overflow-hidden">
                {/* List Header */}
                <div className="p-4 border-b bg-neutral-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <h2 className="text-xl font-semibold text-neutral-800">
                      {selectedList.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Unit Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-600">Units:</span>
                        <UnitToggle
                          value={unitDisplay}
                          onChange={(system) => {
                            setUnitDisplay(system);
                            setShoppingPageOverride(system);
                          }}
                          size="sm"
                        />
                      </div>
                      {(selectedList.checkedCount || 0) > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearChecked}
                          disabled={clearChecked.isPending}
                        >
                          {clearChecked.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Clear Checked
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteList(selectedList.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-neutral-600">
                      {selectedList.checkedCount || 0} / {selectedList.itemCount || 0}
                    </span>
                  </div>
                </div>

                {/* Add Item */}
                <div className="p-4 border-b">
                  <div className="flex gap-2">
                    <Input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Add item..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                    <Button onClick={handleAddItem} disabled={addItem.isPending}>
                      {addItem.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Add
                    </Button>
                  </div>
                </div>

                {/* Items by Category */}
                <div className="divide-y">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryEmoji(category)}</span>
                          <span className="font-medium text-neutral-700">
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-sm text-neutral-400">
                            ({items.length})
                          </span>
                        </div>
                        {collapsedCategories.has(category) ? (
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-neutral-400" />
                        )}
                      </button>

                      {/* Category Items */}
                      {!collapsedCategories.has(category) && (
                        <div className="divide-y divide-neutral-100">
                          {items.map((item) => (
                            <ShoppingItemRow
                              key={item.id}
                              item={item}
                              onToggle={() => handleToggleItem(item.id)}
                              onDelete={() => handleDeleteItem(item.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {Object.keys(groupedItems).length === 0 && (
                    <div className="p-8 text-center text-neutral-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                      <p>No items yet</p>
                      <p className="text-sm">Add items above to get started</p>
                    </div>
                  )}
                </div>
              </Card>
            ) : null
          ) : (
            <Card className="p-8 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
              <p className="text-neutral-600 mb-2">Select a list to view items</p>
              <p className="text-sm text-neutral-400">
                Or create a new list to get started
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Shopping Item Row Component
function ShoppingItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: AggregatedShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const hasOriginalItems = item.originalItems && item.originalItems.length > 1;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 group hover:bg-neutral-50 transition-colors relative',
        item.isChecked && 'bg-green-50'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
          item.isChecked
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-neutral-300 hover:border-primary-400'
        )}
      >
        {item.isChecked && <Check className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="relative group/tooltip">
          <p
            className={cn(
              'font-medium',
              item.isChecked ? 'text-neutral-400 line-through' : 'text-neutral-800'
            )}
          >
            {item.displayQuantity && `${item.displayQuantity} `}
            {item.displayUnit && `${item.displayUnit} `}
            {item.ingredient}
            {hasOriginalItems && (
              <span className="ml-1 text-xs text-primary-500 cursor-help" title="Combined from multiple sources">
                (combined)
              </span>
            )}
          </p>
          {/* Tooltip showing original items */}
          {hasOriginalItems && (
            <div className="invisible group-hover/tooltip:visible absolute left-0 bottom-full mb-1 z-10 px-3 py-2 bg-neutral-800 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
              <div className="font-medium mb-1">Combined from:</div>
              {item.originalItems!.map((orig, idx) => (
                <div key={idx}>
                  {orig.quantity} {orig.unit}
                  {orig.recipeTitle && <span className="text-neutral-400"> ({orig.recipeTitle})</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        {item.recipe && !hasOriginalItems && (
          <Link
            to={`/recipes/${item.recipeId}`}
            className="text-xs text-primary-500 hover:underline"
          >
            From: {item.recipe.title}
          </Link>
        )}
      </div>

      <button
        onClick={onDelete}
        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all"
      >
        <X className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );
}

export default ShoppingListPage;
