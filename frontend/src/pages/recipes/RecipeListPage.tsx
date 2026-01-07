import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Filter, Grid, List, SlidersHorizontal, Search, Loader2, X, ChevronDown, RefreshCw, CheckSquare, Square, Globe, Lock, Users, ShieldCheck, Eye } from 'lucide-react';
import { Button, Input, Card, useToast, RecipeGridSkeleton, EmptyState } from '../../components/ui';
import { RecipeCard } from '../../components/recipes/RecipeCard';
import { useRecipes, useDownloadImage, useBulkUpdateVisibility, useUpdateRecipeVisibility, recipeKeys } from '../../hooks';
import { useCircles } from '../../hooks/useDinnerCircles';
import { useCompatibleRecipes } from '../../hooks/useRecipeCompatibility';
import { RecipeCategory, RecipeDifficulty } from '../../types/recipe';
import type { Recipe, RecipeQuery } from '../../types/recipe';
import { useQueryClient } from '@tanstack/react-query';
import { refreshImageViaExtension, extractShortcode, pingExtension } from '../../services/extension.service';

type SortField = 'createdAt' | 'title' | 'prepTimeMinutes' | 'cookTimeMinutes' | 'servings';
type SortOrder = 'asc' | 'desc';

// Demo mode flag - set to false when backend is ready
const USE_DEMO_DATA = false;

// Mock data for demo
const mockRecipes: Recipe[] = [
  {
    id: '1',
    userId: 'demo',
    title: 'Creamy Tuscan Chicken Pasta',
    description: 'A rich and creamy pasta dish with sun-dried tomatoes and spinach',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    totalTimeMinutes: 40,
    servings: 4,
    difficulty: RecipeDifficulty.MEDIUM,
    category: RecipeCategory.DINNER,
    cuisine: 'Italian',
    tags: ['pasta', 'chicken', 'creamy'],
    source: 'TEXT' as any,
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'demo',
    title: 'Fresh Garden Salad with Lemon Vinaigrette',
    description: 'Crisp mixed greens with seasonal vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    totalTimeMinutes: 10,
    servings: 2,
    difficulty: RecipeDifficulty.EASY,
    category: RecipeCategory.SALAD,
    cuisine: 'American',
    tags: ['salad', 'healthy', 'quick'],
    source: 'TEXT' as any,
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    userId: 'demo',
    title: 'Homemade Margherita Pizza',
    description: 'Classic Neapolitan pizza with fresh mozzarella and basil',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800',
    prepTimeMinutes: 30,
    cookTimeMinutes: 15,
    totalTimeMinutes: 45,
    servings: 4,
    difficulty: RecipeDifficulty.MEDIUM,
    category: RecipeCategory.DINNER,
    cuisine: 'Italian',
    tags: ['pizza', 'italian', 'homemade'],
    source: 'TEXT' as any,
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    userId: 'demo',
    title: 'Thai Green Curry',
    description: 'Aromatic coconut curry with vegetables and tofu',
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
    prepTimeMinutes: 20,
    cookTimeMinutes: 25,
    totalTimeMinutes: 45,
    servings: 4,
    difficulty: RecipeDifficulty.MEDIUM,
    category: RecipeCategory.DINNER,
    cuisine: 'Thai',
    tags: ['curry', 'thai', 'vegetarian'],
    source: 'TEXT' as any,
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    userId: 'demo',
    title: 'Fluffy Buttermilk Pancakes',
    description: 'Light and fluffy pancakes perfect for weekend brunch',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    totalTimeMinutes: 25,
    servings: 4,
    difficulty: RecipeDifficulty.EASY,
    category: RecipeCategory.BREAKFAST,
    cuisine: 'American',
    tags: ['breakfast', 'pancakes', 'brunch'],
    source: 'TEXT' as any,
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    userId: 'demo',
    title: 'Grilled Salmon with Herb Butter',
    description: 'Perfectly grilled salmon fillet with a zesty herb butter',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800',
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    totalTimeMinutes: 22,
    servings: 2,
    difficulty: RecipeDifficulty.EASY,
    category: RecipeCategory.DINNER,
    cuisine: 'American',
    tags: ['salmon', 'seafood', 'healthy'],
    source: 'TEXT' as any,
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function RecipeListPage() {
  const { t } = useTranslation('recipes');
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  // Store selected recipe data (id -> imageUrl, sourceUrl) to support bulk actions across pages
  const [selectedRecipes, setSelectedRecipes] = useState<Map<string, { imageUrl: string | null; sourceUrl: string | null }>>(new Map());
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState({ current: 0, total: 0 });
  // Store all recipe IDs across pages for navigation
  const [allRecipeIds, setAllRecipeIds] = useState<string[]>([]);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);

  // Visibility options for bulk update
  const visibilityOptions = [
    { value: 'PRIVATE' as const, label: 'Private', description: 'Only you can see', icon: Lock },
    { value: 'FOLLOWERS' as const, label: 'Followers', description: 'Your followers can see', icon: Users },
    { value: 'PUBLIC' as const, label: 'Public', description: 'Everyone can see', icon: Globe },
  ];

  // Close visibility menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(event.target as Node)) {
        setShowVisibilityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toast = useToast();
  const queryClient = useQueryClient();
  const downloadImage = useDownloadImage();
  const bulkUpdateVisibility = useBulkUpdateVisibility();
  const updateVisibility = useUpdateRecipeVisibility();

  // Fetch available dinner circles for filter
  const { data: circles } = useCircles();
  const selectedCircle = circles?.find((c) => c.id === selectedCircleId);

  // Category options with translations
  const categoryOptions = [
    { label: t('categories.all'), value: '' },
    { label: t('categories.breakfast'), value: RecipeCategory.BREAKFAST },
    { label: t('categories.lunch'), value: RecipeCategory.LUNCH },
    { label: t('categories.dinner'), value: RecipeCategory.DINNER },
    { label: t('categories.dessert'), value: RecipeCategory.DESSERT },
    { label: t('categories.snack'), value: RecipeCategory.SNACK },
    { label: t('categories.salad'), value: RecipeCategory.SALAD },
    { label: t('categories.soup'), value: RecipeCategory.SOUP },
  ];

  // Read page from URL params, default to 1
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Update page in URL params
  const setPage = (newPage: number | ((prev: number) => number)) => {
    const nextPage = typeof newPage === 'function' ? newPage(page) : newPage;
    const newParams = new URLSearchParams(searchParams);
    if (nextPage === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', String(nextPage));
    }
    setSearchParams(newParams);
  };

  // Read search, author filter, and circle filter from URL on mount
  useEffect(() => {
    const search = searchParams.get('search');
    const author = searchParams.get('author');
    const circleId = searchParams.get('circleId');
    if (search) {
      setSearchQuery(search);
    }
    if (author) {
      setAuthorFilter(author);
    }
    if (circleId) {
      setSelectedCircleId(circleId);
    }
  }, [searchParams]);

  // Clear author filter
  const clearAuthorFilter = () => {
    setAuthorFilter('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('author');
    setSearchParams(newParams);
  };

  // Build query for API - include author in search if present
  const query: RecipeQuery = useMemo(() => ({
    page,
    limit: 20,
    search: authorFilter || searchQuery || undefined,
    category: selectedCategory as RecipeCategory || undefined,
    sortBy,
    sortOrder,
  }), [page, searchQuery, selectedCategory, authorFilter, sortBy, sortOrder]);

  // Reset stored recipe IDs when filters change (but not page)
  useEffect(() => {
    sessionStorage.removeItem('recipeListIds');
    sessionStorage.removeItem('recipeListTotal');
    setAllRecipeIds([]);
  }, [searchQuery, selectedCategory, authorFilter, sortBy, sortOrder]);

  // Selection handlers - store id, imageUrl, and sourceUrl for bulk operations across pages
  const handleSelectRecipe = (recipe: Recipe, selected: boolean) => {
    const newSelected = new Map(selectedRecipes);
    if (selected) {
      newSelected.set(recipe.id, {
        imageUrl: recipe.imageUrl || null,
        sourceUrl: recipe.sourceUrl || null,
      });
    } else {
      newSelected.delete(recipe.id);
    }
    setSelectedRecipes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRecipes.size === recipes.length) {
      setSelectedRecipes(new Map());
    } else {
      const newSelected = new Map(selectedRecipes);
      recipes.forEach(r => newSelected.set(r.id, {
        imageUrl: r.imageUrl || null,
        sourceUrl: r.sourceUrl || null,
      }));
      setSelectedRecipes(newSelected);
    }
  };

  const clearSelection = () => {
    setSelectedRecipes(new Map());
    setSelectMode(false);
  };

  // Bulk reload images via Chrome extension - works across all pages
  const handleBulkReloadImages = async () => {
    if (selectedRecipes.size === 0) return;

    // Check if extension is available
    const extensionAvailable = await pingExtension();
    if (!extensionAvailable) {
      toast.error('SavorPilot extension not detected. Please install and enable the extension, then refresh the page.');
      return;
    }

    // Filter recipes that need reloading (external images with Instagram source URL)
    const recipesToReload: Array<{ id: string; shortcode: string }> = [];
    for (const [recipeId, data] of selectedRecipes) {
      const imageUrl = data.imageUrl;
      const sourceUrl = data.sourceUrl;
      // Only reload if image is external (not stored locally) and has Instagram source
      if (imageUrl?.startsWith('http') && !imageUrl?.includes('/uploads/') && sourceUrl) {
        const shortcode = extractShortcode(sourceUrl);
        if (shortcode) {
          recipesToReload.push({ id: recipeId, shortcode });
        }
      }
    }

    if (recipesToReload.length === 0) {
      toast.info('No recipes with external Instagram images to reload.');
      clearSelection();
      return;
    }

    setIsReloading(true);
    setReloadProgress({ current: 0, total: recipesToReload.length });

    let success = 0;
    let failed = 0;

    toast.info(`Reloading ${recipesToReload.length} images via extension...`);

    // Process each recipe sequentially
    for (let i = 0; i < recipesToReload.length; i++) {
      const { id, shortcode } = recipesToReload[i];
      setReloadProgress({ current: i + 1, total: recipesToReload.length });

      try {
        const result = await refreshImageViaExtension(id, shortcode);
        if (result.success) {
          success++;
        } else {
          console.error(`Failed to reload image for recipe ${id}:`, result.error);
          failed++;
        }
      } catch (err) {
        console.error(`Error reloading image for recipe ${id}:`, err);
        failed++;
      }
    }

    // Refresh the recipe list to show updated images
    queryClient.invalidateQueries({ queryKey: recipeKeys.all });

    setIsReloading(false);
    setReloadProgress({ current: 0, total: 0 });

    if (success > 0) {
      toast.success(t('list.bulkActions.reloadSuccess', { count: success }));
    }
    if (failed > 0) {
      toast.error(t('list.bulkActions.reloadFailed', { count: failed }));
    }
    clearSelection();
  };

  // Bulk update visibility
  const handleBulkVisibility = async (visibility: 'PRIVATE' | 'FOLLOWERS' | 'PUBLIC') => {
    if (selectedRecipes.size === 0) return;

    try {
      const recipeIds = Array.from(selectedRecipes.keys());
      const result = await bulkUpdateVisibility.mutateAsync({ recipeIds, visibility });
      const labels = { PRIVATE: 'private', FOLLOWERS: 'followers-only', PUBLIC: 'public' };
      toast.success(`${result.updated} recipes set to ${labels[visibility]}`);
      if (result.failed.length > 0) {
        toast.warning(`${result.failed.length} recipes could not be updated`);
      }
      clearSelection();
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  // Individual visibility change handler
  const handleVisibilityChange = async (recipeId: string, isPublic: boolean) => {
    try {
      await updateVisibility.mutateAsync({ recipeId, isPublic });
      toast.success(isPublic ? 'Recipe is now public' : 'Recipe is now private');
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  // Fetch recipes from API (only when not in demo mode)
  const { data: apiData, isLoading: isLoadingRecipes, error } = useRecipes(
    USE_DEMO_DATA || selectedCircleId ? undefined : query
  );

  // Fetch compatible recipes when a circle is selected
  const { data: compatibleData, isLoading: isLoadingCompatible } = useCompatibleRecipes(
    selectedCircleId || undefined,
    { page, limit: 20, search: searchQuery || undefined, category: selectedCategory || undefined }
  );

  const isLoading = selectedCircleId ? isLoadingCompatible : isLoadingRecipes;

  // Store recipe IDs for navigation between recipes - accumulate across pages
  useEffect(() => {
    if (apiData?.data && apiData.data.length > 0) {
      const currentPageIds = apiData.data.map((r) => r.id);
      const limit = query.limit || 20;

      // Get existing stored data
      let storedIds: string[] = [];
      try {
        const stored = sessionStorage.getItem('recipeListIds');
        if (stored) storedIds = JSON.parse(stored);
      } catch { /* ignore */ }

      // Calculate positions for current page's recipes
      const startIndex = (page - 1) * limit;

      // Expand array if needed to fit current page
      const totalSlots = Math.max(storedIds.length, startIndex + currentPageIds.length);
      const newIds = new Array(totalSlots).fill(null);

      // Copy existing IDs
      storedIds.forEach((id, i) => { newIds[i] = id; });

      // Insert current page's IDs at correct positions
      currentPageIds.forEach((id, i) => { newIds[startIndex + i] = id; });

      // Filter out nulls and store
      const finalIds = newIds.filter((id): id is string => id !== null);
      sessionStorage.setItem('recipeListIds', JSON.stringify(finalIds));
      sessionStorage.setItem('recipeListPage', String(page));
      sessionStorage.setItem('recipeListTotal', String(apiData.total || finalIds.length));

      setAllRecipeIds(finalIds);
    }
  }, [apiData?.data, page, query.limit]);

  // Use mock data in demo mode, compatible recipes when circle selected, or API data
  const recipes = useMemo(() => {
    if (USE_DEMO_DATA) {
      let filtered = [...mockRecipes];

      // Apply search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.title.toLowerCase().includes(search) ||
            r.description?.toLowerCase().includes(search) ||
            r.cuisine?.toLowerCase().includes(search)
        );
      }

      // Apply category filter
      if (selectedCategory) {
        filtered = filtered.filter((r) => r.category === selectedCategory);
      }

      return filtered;
    }

    // Use compatible recipes when a circle is selected
    if (selectedCircleId && compatibleData?.data) {
      return compatibleData.data;
    }

    return apiData?.data || [];
  }, [apiData, compatibleData, selectedCircleId, searchQuery, selectedCategory]);

  const totalRecipes = useMemo(() => {
    if (USE_DEMO_DATA) return mockRecipes.length;
    if (selectedCircleId && compatibleData) return compatibleData.total;
    return apiData?.total || 0;
  }, [selectedCircleId, compatibleData, apiData]);

  // Map category enum to display name
  const getCategoryLabel = (category?: RecipeCategory) => {
    if (!category) return '';
    return category.charAt(0) + category.slice(1).toLowerCase().replace('_', ' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">{t('list.title')}</h1>
          <p className="text-primary-600">
            {t('list.subtitle', { count: totalRecipes })}
          </p>
        </div>
        <Link to="/recipes/new?source=image">
          <Button>
            <Plus className="w-4 h-4" />
            {t('list.addRecipe')}
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
        <Input
          type="text"
          placeholder={t('list.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-4 pb-2 overflow-x-auto scrollbar-hide">
        {categoryOptions.map((category) => (
          <button
            key={category.value || 'all'}
            onClick={() => {
              setSelectedCategory(category.value);
              setPage(1);
            }}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              transition-all duration-200
              ${selectedCategory === category.value
                ? 'bg-primary-800 text-white'
                : 'bg-white text-primary-600 hover:bg-primary-50 border border-primary-200'
              }
            `}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Author Filter Indicator */}
      {authorFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary-600">{t('list.filterByChef')}</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
            {authorFilter}
            <button
              onClick={clearAuthorFilter}
              className="ml-1 p-0.5 hover:bg-primary-200 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary-50 border-primary-200 text-primary-600' : ''}
          >
            <Filter className="w-4 h-4" />
            {t('list.filters')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) clearSelection();
            }}
            className={selectMode ? 'bg-primary-50 border-primary-200 text-primary-600' : ''}
          >
            {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {t('list.select')}
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-primary-100 p-1 rounded-lg">
          <button
            aria-label="Grid view"
            onClick={() => setViewMode('grid')}
            className={`
              p-2 rounded-md transition-colors
              ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-900' : 'text-primary-500'}
            `}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            aria-label="List view"
            onClick={() => setViewMode('list')}
            className={`
              p-2 rounded-md transition-colors
              ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-900' : 'text-primary-500'}
            `}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-4 flex items-center gap-4 flex-wrap">
          {/* Circle Filter */}
          {circles && circles.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-neutral-500">Safe for</span>
              <div className="relative">
                <select
                  value={selectedCircleId || ''}
                  onChange={(e) => {
                    setSelectedCircleId(e.target.value || null);
                    setPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="">All Recipes</option>
                  {circles.map((circle) => (
                    <option key={circle.id} value={circle.id}>
                      {circle.emoji || '👥'} {circle.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Divider */}
          {circles && circles.length > 0 && (
            <div className="w-px h-6 bg-neutral-200" />
          )}

          {/* Sort by */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">{t('list.sort.label')}</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="appearance-none pl-3 pr-8 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="createdAt">{t('list.sort.dateAdded')}</option>
                <option value="title">{t('list.sort.title')}</option>
                <option value="prepTimeMinutes">{t('list.sort.prepTime')}</option>
                <option value="cookTimeMinutes">{t('list.sort.cookTime')}</option>
                <option value="servings">{t('list.sort.servings')}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border rounded-lg bg-white hover:bg-neutral-50 text-sm"
              title={sortOrder === 'asc' ? t('list.sort.ascending') : t('list.sort.descending')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </Card>
      )}

      {/* Active Circle Filter Badge */}
      {selectedCircleId && selectedCircle && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            Safe for {selectedCircle.emoji || '👥'} {selectedCircle.name}
            <button
              onClick={() => setSelectedCircleId(null)}
              className="ml-1 p-0.5 hover:bg-green-200 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {/* Selection Actions */}
      {selectMode && (
        <Card className="sticky top-28 lg:top-32 z-20 p-4 flex items-center gap-4 flex-wrap shadow-md">
          <span className="text-sm font-medium text-primary-700">
            {t('list.selection.selected', { count: selectedRecipes.size })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-sm text-coral-600 hover:text-coral-700"
            >
              {selectedRecipes.size === recipes.length ? t('list.selection.deselectAll') : t('list.selection.selectAll')}
            </button>
            {selectedRecipes.size > 0 && (
              <>
                <span className="text-primary-300">|</span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-primary-500 hover:text-primary-700"
                >
                  {t('list.selection.clearSelection')}
                </button>
              </>
            )}
          </div>
          <div className="flex-1" />
          {selectedRecipes.size > 0 && (
            <div className="flex items-center gap-2">
              {/* Visibility dropdown */}
              <div className="relative" ref={visibilityMenuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                  disabled={bulkUpdateVisibility.isPending}
                >
                  {bulkUpdateVisibility.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Visibility
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
                {showVisibilityMenu && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider border-b border-neutral-100">
                      Set visibility for {selectedRecipes.size} recipe{selectedRecipes.size !== 1 ? 's' : ''}
                    </div>
                    {visibilityOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleBulkVisibility(option.value);
                          setShowVisibilityMenu(false);
                        }}
                        disabled={bulkUpdateVisibility.isPending}
                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                      >
                        <option.icon className="w-4 h-4 text-neutral-500" />
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900">{option.label}</div>
                          <div className="text-xs text-neutral-500">{option.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReloadImages}
                disabled={isReloading}
              >
                {isReloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isReloading && reloadProgress.total > 0
                  ? `${reloadProgress.current}/${reloadProgress.total}`
                  : isReloading
                    ? t('list.bulkActions.reloading')
                    : t('list.bulkActions.reloadImages')}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !USE_DEMO_DATA && (
        <RecipeGridSkeleton count={8} />
      )}

      {/* Error State */}
      {error && !USE_DEMO_DATA && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">{t('list.error.title')}</h3>
          <p className="mt-1 text-neutral-500">{t('list.error.message')}</p>
        </div>
      )}

      {/* Recipe Grid */}
      {!isLoading && !error && (
        <div className={`
          grid gap-6
          ${viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }
        `}>
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`relative ${selectMode ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (selectMode) {
                  handleSelectRecipe(recipe, !selectedRecipes.has(recipe.id));
                }
              }}
            >
              {/* Selection checkbox */}
              {selectMode && (
                <div className="absolute top-3 left-3 z-10">
                  <div
                    className={`
                      w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer
                      ${selectedRecipes.has(recipe.id) ? 'bg-primary-500 border-primary-500' : 'bg-white/80 border-neutral-300 hover:border-primary-400'}
                    `}
                  >
                    {selectedRecipes.has(recipe.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
              {/* Overlay to block clicks when in select mode */}
              {selectMode && (
                <div className="absolute inset-0 z-[5]" />
              )}
              <RecipeCard
                id={recipe.id}
                title={recipe.title}
                description={recipe.description}
                imageUrl={recipe.imageUrl}
                sourceUrl={recipe.sourceUrl}
                sourceAuthor={recipe.sourceAuthor}
                prepTime={recipe.prepTimeMinutes}
                cookTime={recipe.cookTimeMinutes}
                servings={recipe.servings}
                difficulty={recipe.difficulty}
                category={getCategoryLabel(recipe.category)}
                cuisine={recipe.cuisine}
                forkCount={recipe.forkCount}
                isPublic={recipe.isPublic}
                user={recipe.user}
                parentRecipe={recipe.parentRecipe}
                onVisibilityChange={handleVisibilityChange}
                className={selectMode && selectedRecipes.has(recipe.id) ? 'ring-2 ring-primary-500' : ''}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && recipes.length === 0 && (
        <EmptyState
          illustration={searchQuery || selectedCategory ? 'search' : 'recipes'}
          title={t('list.empty.title')}
          description={searchQuery || selectedCategory ? t('list.empty.tryAdjusting') : t('list.empty.noRecipesYet')}
          action={!searchQuery && !selectedCategory ? {
            label: t('list.empty.addFirst'),
            href: '/recipes/new?source=image'
          } : undefined}
        />
      )}

      {/* Pagination */}
      {!USE_DEMO_DATA && (
        (selectedCircleId ? compatibleData : apiData)?.totalPages ?? 0
      ) > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('list.pagination.previous')}
          </Button>
          <span className="text-sm text-primary-600">
            {t('list.pagination.page', {
              current: page,
              total: (selectedCircleId ? compatibleData : apiData)?.totalPages ?? 1
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!(selectedCircleId ? compatibleData : apiData)?.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('list.pagination.next')}
          </Button>
        </div>
      )}

      {/* Demo Mode Banner */}
      {USE_DEMO_DATA && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
          {t('list.demoMode')}
        </div>
      )}
    </div>
  );
}
