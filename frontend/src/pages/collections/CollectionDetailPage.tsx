import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  MoreVertical,
  Lock,
  Globe,
  Clock,
  ChefHat,
  GripVertical,
  X,
  Search,
  Share2,
  Users,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button, Card, Input, Badge, useConfirm, useToast } from '../../components/ui';
import { ShareModal } from '../../components/sharing';
import { useGroup, useDeleteGroup, useRemoveRecipesFromGroup, useAddRecipesToGroup, useUpdateGroup } from '../../hooks';
import { useRecipes } from '../../hooks';
import type { GroupDetail, GroupVisibility } from '../../types/recipe';

// Visibility options
const visibilityOptions: { value: GroupVisibility; label: string; icon: typeof Lock; description: string }[] = [
  { value: 'PRIVATE', label: 'Private', icon: Lock, description: 'Only you can see' },
  { value: 'FOLLOWERS', label: 'Followers', icon: Users, description: 'Your followers can see' },
  { value: 'PUBLIC', label: 'Public', icon: Globe, description: 'Anyone can see' },
];

// Demo mode toggle
const USE_DEMO_DATA = false;

// Demo data for UI preview
const demoCollection = {
  id: '1',
  userId: 'demo-user',
  name: 'Weeknight Dinners',
  description: 'Quick and easy meals for busy weekdays. These recipes are perfect when you need something delicious on the table in under an hour.',
  coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
  isPublic: false,
  visibility: 'PRIVATE' as GroupVisibility,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  recipes: [
    {
      id: '1',
      title: 'Creamy Tuscan Chicken Pasta',
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
      category: 'DINNER' as const,
      cuisine: 'Italian',
      totalTimeMinutes: 40,
      sortOrder: 0,
    },
    {
      id: '2',
      title: 'Honey Garlic Salmon',
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
      category: 'DINNER' as const,
      cuisine: 'Asian',
      totalTimeMinutes: 25,
      sortOrder: 1,
    },
    {
      id: '3',
      title: 'Quick Beef Tacos',
      imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
      category: 'DINNER' as const,
      cuisine: 'Mexican',
      totalTimeMinutes: 20,
      sortOrder: 2,
    },
    {
      id: '4',
      title: 'Lemon Herb Chicken',
      imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400',
      category: 'DINNER' as const,
      cuisine: 'Mediterranean',
      totalTimeMinutes: 35,
      sortOrder: 3,
    },
    {
      id: '5',
      title: 'Vegetable Stir Fry',
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
      category: 'DINNER' as const,
      cuisine: 'Asian',
      totalTimeMinutes: 15,
      sortOrder: 4,
    },
  ],
} satisfies GroupDetail;

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const visibilityRef = useRef<HTMLDivElement>(null);

  // Hooks for real data
  const { data: groupData, isLoading } = useGroup(id || '');
  const deleteGroup = useDeleteGroup();
  const removeRecipes = useRemoveRecipesFromGroup();
  const addRecipes = useAddRecipesToGroup();
  const updateGroup = useUpdateGroup();

  // Hooks for dialogs
  const confirm = useConfirm();
  const toast = useToast();

  // Close visibility menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (visibilityRef.current && !visibilityRef.current.contains(event.target as Node)) {
        setShowVisibilityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVisibilityChange = async (visibility: GroupVisibility) => {
    if (!id) return;
    try {
      await updateGroup.mutateAsync({ id, data: { visibility } });
      toast.success('Visibility updated');
    } catch (error) {
      toast.error('Failed to update visibility');
    }
    setShowVisibilityMenu(false);
  };

  // Use demo or real data
  const collection = USE_DEMO_DATA ? demoCollection : groupData;

  // Handle delete collection
  const handleDeleteCollection = async () => {
    const confirmed = await confirm({
      title: 'Delete Collection',
      message: 'Are you sure you want to delete this collection? Recipes will not be deleted.',
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteGroup.mutateAsync(id!);
      navigate('/collections');
    } catch (error) {
      console.error('Failed to delete collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  // Handle remove recipe from collection
  const handleRemoveRecipe = async (recipeId: string) => {
    const confirmed = await confirm({
      title: 'Remove Recipe',
      message: 'Remove this recipe from the collection?',
      confirmText: 'Remove',
      variant: 'warning',
    });
    if (!confirmed) return;

    try {
      await removeRecipes.mutateAsync({ groupId: id!, recipeIds: [recipeId] });
      setActiveMenu(null);
    } catch (error) {
      console.error('Failed to remove recipe:', error);
      toast.error('Failed to remove recipe');
    }
  };

  // Handle add recipes to collection
  const handleAddRecipes = async (recipeIds: string[]) => {
    try {
      await addRecipes.mutateAsync({ groupId: id!, recipeIds });
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add recipes:', error);
    }
  };

  if (!USE_DEMO_DATA && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-neutral-900">Collection not found</h2>
        <p className="text-neutral-600 mt-2">This collection may have been deleted.</p>
        <Link to="/collections">
          <Button className="mt-4">Back to Collections</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {USE_DEMO_DATA && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm">
            <strong>Demo Mode:</strong> Showing sample data. Connect to backend to see real data.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/collections')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Collections
        </button>
        <div className="flex items-center gap-2">
          {/* Visibility Dropdown */}
          <div className="relative" ref={visibilityRef}>
            <Button
              variant="outline"
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className="min-w-[140px] justify-between"
            >
              {(() => {
                const visibility = collection.visibility || (collection.isPublic ? 'PUBLIC' : 'PRIVATE');
                const current = visibilityOptions.find(o => o.value === visibility);
                const Icon = current?.icon || Lock;
                return (
                  <>
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {current?.label || 'Private'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </>
                );
              })()}
            </Button>
            {showVisibilityMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-50">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  const visibility = collection.visibility || (collection.isPublic ? 'PUBLIC' : 'PRIVATE');
                  const isSelected = option.value === visibility;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleVisibilityChange(option.value)}
                      className="w-full px-4 py-2.5 text-left hover:bg-neutral-50 flex items-center gap-3"
                    >
                      <Icon className="w-4 h-4 text-neutral-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900">{option.label}</p>
                        <p className="text-xs text-neutral-500">{option.description}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Button variant="outline" onClick={() => setShowShareModal(true)}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="outline" onClick={() => navigate(`/collections/${id}/edit`)}>
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={handleDeleteCollection}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Collection Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700">
        {collection.coverImage && (
          <img
            src={collection.coverImage}
            alt={collection.name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
                {(() => {
                  const visibility = collection.visibility || (collection.isPublic ? 'PUBLIC' : 'PRIVATE');
                  const current = visibilityOptions.find(o => o.value === visibility);
                  const Icon = current?.icon || Lock;
                  return (
                    <Badge className="bg-white/20 text-white border-0">
                      <Icon className="w-3 h-3 mr-1" />
                      {current?.label || 'Private'}
                    </Badge>
                  );
                })()}
              </div>
              {collection.description && (
                <p className="text-primary-100 max-w-2xl">{collection.description}</p>
              )}
              <div className="flex items-center gap-6 mt-4 text-primary-100">
                <span className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  {collection.recipes.length} recipes
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Updated {new Date(collection.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Recipe Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neutral-900">Recipes in this collection</h2>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Add Recipes
        </Button>
      </div>

      {/* Empty State */}
      {collection.recipes.length === 0 && (
        <Card className="p-12 text-center">
          <ChefHat className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No recipes yet</h3>
          <p className="text-neutral-600 mb-6">
            Add recipes to this collection to get started
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Recipes
          </Button>
        </Card>
      )}

      {/* Recipe Grid */}
      {collection.recipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collection.recipes.map((recipe) => (
            <RecipeInCollectionCard
              key={recipe.id}
              recipe={recipe}
              onRemove={() => handleRemoveRecipe(recipe.id)}
              isMenuOpen={activeMenu === recipe.id}
              onMenuToggle={() => setActiveMenu(activeMenu === recipe.id ? null : recipe.id)}
            />
          ))}
        </div>
      )}

      {/* Add Recipes Modal */}
      {showAddModal && (
        <AddRecipesModal
          existingRecipeIds={collection.recipes.map((r) => r.id)}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddRecipes}
          isLoading={addRecipes.isPending}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="collection"
        itemId={collection.id}
        itemName={collection.name}
      />
    </div>
  );
}

// Recipe Card in Collection
interface RecipeInCollectionCardProps {
  recipe: {
    id: string;
    title: string;
    imageUrl?: string;
    category?: string;
    cuisine?: string;
    totalTimeMinutes?: number;
  };
  onRemove: () => void;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

function RecipeInCollectionCard({ recipe, onRemove, isMenuOpen, onMenuToggle }: RecipeInCollectionCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/recipes/${recipe.id}`)}
    >
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-primary-100 to-primary-200">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-primary-400" />
          </div>
        )}

        {/* Drag Handle (for reordering - future feature) */}
        <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/80 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Menu Button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-neutral-600 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                View Recipe
              </button>
              <button
                onClick={onRemove}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Remove from Collection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 line-clamp-1">{recipe.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500">
          {recipe.category && (
            <Badge variant="secondary" className="text-xs">
              {recipe.category.charAt(0) + recipe.category.slice(1).toLowerCase()}
            </Badge>
          )}
          {recipe.cuisine && (
            <span>{recipe.cuisine}</span>
          )}
          {recipe.totalTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {recipe.totalTimeMinutes} min
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// Add Recipes Modal
interface AddRecipesModalProps {
  existingRecipeIds: string[];
  onClose: () => void;
  onAdd: (recipeIds: string[]) => void;
  isLoading: boolean;
}

function AddRecipesModal({ existingRecipeIds, onClose, onAdd, isLoading }: AddRecipesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch all recipes
  const { data: recipesData } = useRecipes({ limit: 50, search: searchQuery });

  // Demo recipes for UI preview
  const demoRecipes = [
    { id: '10', title: 'Spaghetti Bolognese', imageUrl: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=200' },
    { id: '11', title: 'Grilled Cheese Sandwich', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200' },
    { id: '12', title: 'Caesar Salad', imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=200' },
    { id: '13', title: 'Mushroom Risotto', imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=200' },
    { id: '14', title: 'Fish and Chips', imageUrl: 'https://images.unsplash.com/photo-1579208030886-b1a5ed1e9b5c?w=200' },
    { id: '15', title: 'Chicken Curry', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200' },
  ];

  const recipes = USE_DEMO_DATA ? demoRecipes : (recipesData?.data || []);

  // Filter out recipes already in collection
  const availableRecipes = recipes.filter((r) => !existingRecipeIds.includes(r.id));

  const toggleRecipe = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAdd = () => {
    if (selectedIds.size > 0) {
      onAdd(Array.from(selectedIds));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900">Add Recipes to Collection</h2>
            <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto p-6">
          {availableRecipes.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No recipes available to add
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {availableRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => toggleRecipe(recipe.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    selectedIds.has(recipe.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-6 h-6 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">{recipe.title}</p>
                  </div>
                  {selectedIds.has(recipe.id) && (
                    <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 flex justify-between items-center">
          <p className="text-sm text-neutral-600">
            {selectedIds.size} recipe{selectedIds.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selectedIds.size === 0 || isLoading}>
              {isLoading ? 'Adding...' : `Add ${selectedIds.size > 0 ? selectedIds.size : ''} Recipe${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
