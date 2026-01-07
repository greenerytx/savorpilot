import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Loader2,
  ChefHat,
  Clock,
  GitFork,
  TrendingUp,
  Filter,
  Users,
  X,
} from 'lucide-react';
import { Card, Badge, Button } from '../../components/ui';
import { publicService, type PublicRecipe } from '../../services/public.service';
import { socialService } from '../../services/social.service';
import { cn, getImageUrl } from '../../lib/utils';

type SortOption = 'recent' | 'popular' | 'trending';

export function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'recipes' | 'community'>('recipes');

  // Fetch public recipes
  const {
    data: recipesData,
    isLoading: recipesLoading,
    error: recipesError,
  } = useQuery({
    queryKey: ['explore-recipes', searchQuery, selectedCuisine, selectedCategory, sortBy],
    queryFn: () =>
      publicService.getPublicRecipes({
        search: searchQuery || undefined,
        cuisine: selectedCuisine || undefined,
        category: selectedCategory || undefined,
        sortBy: sortBy === 'recent' ? 'createdAt' : sortBy === 'popular' ? 'forkCount' : 'createdAt',
        sortOrder: 'desc',
        limit: 30,
      }),
    enabled: activeTab === 'recipes',
  });

  // Fetch trending recipes
  const { data: trendingRecipes } = useQuery({
    queryKey: ['trending-recipes'],
    queryFn: () => publicService.getTrendingRecipes(6),
    enabled: activeTab === 'recipes' && !searchQuery && !selectedCuisine && !selectedCategory,
  });

  // Fetch follow suggestions (as a way to discover users)
  const { data: suggestedUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['follow-suggestions'],
    queryFn: () => socialService.getFollowSuggestions(20),
    enabled: activeTab === 'community',
  });

  const recipes = recipesData?.data || [];
  const hasActiveFilters = searchQuery || selectedCuisine || selectedCategory;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCuisine('');
    setSelectedCategory('');
  };

  const cuisines = [
    'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian',
    'Thai', 'French', 'Mediterranean', 'American', 'Korean',
  ];

  const categories = [
    'Breakfast', 'Lunch', 'Dinner', 'Appetizer', 'Dessert',
    'Snack', 'Beverage', 'Side Dish', 'Soup', 'Salad',
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Explore</h1>
          <p className="text-neutral-500">Discover recipes and people from the community</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('recipes')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'recipes'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            <ChefHat className="w-4 h-4 inline mr-1.5" />
            Recipes
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'community'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            <Users className="w-4 h-4 inline mr-1.5" />
            Community
          </button>
        </div>
      </div>

      {activeTab === 'recipes' && (
        <>
          {/* Search and Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search public recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && 'bg-primary-50')}
              >
                <Filter className="w-4 h-4 mr-1.5" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                    {[selectedCuisine, selectedCategory].filter(Boolean).length}
                  </span>
                )}
              </Button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Forked</option>
                <option value="trending">Trending</option>
              </select>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
                {/* Cuisine */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Cuisine
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {cuisines.map((cuisine) => (
                      <button
                        key={cuisine}
                        onClick={() =>
                          setSelectedCuisine(selectedCuisine === cuisine ? '' : cuisine)
                        }
                        className={cn(
                          'px-3 py-1 text-sm rounded-full border transition-colors',
                          selectedCuisine === cuisine
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-neutral-200 text-neutral-600 hover:border-primary-300'
                        )}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() =>
                          setSelectedCategory(selectedCategory === category ? '' : category)
                        }
                        className={cn(
                          'px-3 py-1 text-sm rounded-full border transition-colors',
                          selectedCategory === category
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-neutral-200 text-neutral-600 hover:border-primary-300'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Trending Section */}
          {!hasActiveFilters && trendingRecipes && trendingRecipes.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-3">
                <TrendingUp className="w-5 h-5 text-coral-500" />
                Trending Now
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {trendingRecipes.map((recipe) => (
                  <Link key={recipe.id} to={`/r/${recipe.id}`}>
                    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                      {recipe.imageUrl ? (
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={getImageUrl(recipe.imageUrl)}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                          <ChefHat className="w-8 h-8 text-neutral-300" />
                        </div>
                      )}
                      <div className="p-2">
                        <h3 className="font-medium text-sm text-neutral-900 line-clamp-1">
                          {recipe.title}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          {recipe.user.firstName} {recipe.user.lastName}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recipe Grid */}
          <div>
            {!hasActiveFilters && (
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">All Public Recipes</h2>
            )}

            {recipesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : recipesError ? (
              <Card className="p-8 text-center">
                <p className="text-neutral-600">Failed to load recipes. Please try again.</p>
              </Card>
            ) : recipes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recipes.map((recipe: PublicRecipe) => (
                  <Link key={recipe.id} to={`/r/${recipe.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                      {recipe.imageUrl ? (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={getImageUrl(recipe.imageUrl)}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-neutral-100 flex items-center justify-center">
                          <ChefHat className="w-12 h-12 text-neutral-300" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-neutral-900 line-clamp-1 mb-1">
                          {recipe.title}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/profile/${recipe.user.id}`);
                          }}
                          className="text-sm text-primary-600 hover:underline text-left"
                        >
                          {recipe.user.firstName} {recipe.user.lastName}
                        </button>
                        {recipe.description && (
                          <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
                            {recipe.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {recipe.cuisine && (
                            <Badge variant="secondary" className="text-xs">
                              {recipe.cuisine}
                            </Badge>
                          )}
                          {recipe.category && (
                            <Badge variant="outline" className="text-xs">
                              {recipe.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                          {recipe.totalTimeMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {recipe.totalTimeMinutes} min
                            </span>
                          )}
                          {recipe.forkCount > 0 && (
                            <span className="flex items-center gap-1">
                              <GitFork className="w-3 h-3" />
                              {recipe.forkCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <ChefHat className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                <p className="text-neutral-600">
                  {hasActiveFilters
                    ? 'No recipes match your filters'
                    : 'No public recipes yet. Be the first to share!'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-3" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </Card>
            )}
          </div>
        </>
      )}

      {activeTab === 'community' && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">People sharing public recipes</h2>

          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : suggestedUsers && suggestedUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {suggestedUsers.map((user) => (
                <Link key={user.id} to={`/profile/${user.id}`}>
                  <Card className={cn(
                    "p-4 hover:shadow-lg transition-shadow cursor-pointer",
                    user.isFollowing && "ring-1 ring-primary-200 bg-primary-50/30"
                  )}>
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={getImageUrl(user.avatarUrl)}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-900 truncate">
                            {user.firstName} {user.lastName}
                          </h3>
                          {user.isFollowing && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Following
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-neutral-500">
                          {user.recipeCount} public recipe{user.recipeCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {user.reason && !user.isFollowing && (
                      <p className="text-xs text-neutral-400 mt-2">{user.reason}</p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
              <p className="text-neutral-600">No community members to discover yet</p>
              <p className="text-sm text-neutral-400 mt-1">
                Be the first to share a public recipe!
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default ExplorePage;
