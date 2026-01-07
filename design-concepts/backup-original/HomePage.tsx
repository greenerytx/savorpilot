import { Link } from 'react-router-dom';
import { Plus, Sparkles, ArrowRight, ChefHat, FolderOpen, Share2, BookOpen, Instagram, Youtube, Camera, Wand2 } from 'lucide-react';
import { Button, Card, CardContent } from '../components/ui';
import { RecipeCard } from '../components/recipes/RecipeCard';
import { RecommendedRecipes } from '../components/recipes';
import { useAuthStore } from '../stores/authStore';
import { useRecipeStatistics, useRecipes, useUpdateRecipeVisibility } from '../hooks';
import { useGroups } from '../hooks';
import { useToast } from '../components/ui';

// Demo mode toggle
const USE_DEMO_DATA = false;

// Demo data for UI preview
const demoRecentRecipes = [
  {
    id: '1',
    title: 'Creamy Tuscan Chicken Pasta',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'MEDIUM' as const,
    category: 'Dinner',
    cuisine: 'Italian',
  },
  {
    id: '2',
    title: 'Fresh Garden Salad',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'EASY' as const,
    category: 'Salad',
  },
  {
    id: '3',
    title: 'Homemade Margherita Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800',
    prepTime: 30,
    cookTime: 15,
    servings: 4,
    difficulty: 'MEDIUM' as const,
    category: 'Dinner',
    cuisine: 'Italian',
  },
];

const demoStats = {
  totalRecipes: 47,
  byCategory: [
    { category: 'DINNER', count: 18 },
    { category: 'LUNCH', count: 12 },
    { category: 'BREAKFAST', count: 8 },
    { category: 'DESSERT', count: 9 },
  ],
  topCuisines: [
    { cuisine: 'Italian', count: 15 },
    { cuisine: 'Mexican', count: 10 },
    { cuisine: 'Asian', count: 8 },
  ],
  recentRecipes: demoRecentRecipes.map((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.imageUrl,
    createdAt: new Date().toISOString(),
  })),
};

export function HomePage() {
  const { user } = useAuthStore();
  const greeting = getGreeting();
  const toast = useToast();
  const updateVisibility = useUpdateRecipeVisibility();

  // Hooks for real data
  const { data: statsData } = useRecipeStatistics();
  const { data: recipesData } = useRecipes({ limit: 3, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: groupsData } = useGroups({ limit: 10 });

  // Handle visibility change
  const handleVisibilityChange = async (recipeId: string, isPublic: boolean) => {
    try {
      await updateVisibility.mutateAsync({ recipeId, isPublic });
      toast.success(isPublic ? 'Recipe is now public' : 'Recipe is now private');
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  // Use demo or real data
  const stats = USE_DEMO_DATA ? demoStats : statsData;
  const recentRecipes = USE_DEMO_DATA ? demoRecentRecipes : (recipesData?.data || []).map((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.imageUrl,
    prepTime: r.prepTimeMinutes,
    cookTime: r.cookTimeMinutes,
    servings: r.servings,
    difficulty: r.difficulty,
    category: r.category,
    cuisine: r.cuisine,
    forkCount: r.forkCount,
    isPublic: r.isPublic,
  }));
  const collectionsCount = USE_DEMO_DATA ? 8 : (groupsData?.data?.length || 0);

  // Calculate quick stats
  const quickStats = [
    {
      label: 'Total Recipes',
      value: stats?.totalRecipes?.toString() || '0',
      icon: BookOpen,
      color: 'bg-primary-100 text-primary-600'
    },
    {
      label: 'Collections',
      value: collectionsCount.toString(),
      icon: FolderOpen,
      color: 'bg-sage-100 text-sage-600'
    },
    {
      label: 'Top Cuisine',
      value: stats?.topCuisines?.[0]?.cuisine || 'None',
      icon: ChefHat,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      label: 'Shared',
      value: '0',
      icon: Share2,
      color: 'bg-purple-100 text-purple-600'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Demo Mode Banner */}
      {USE_DEMO_DATA && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm">
            <strong>Demo Mode:</strong> Showing sample data. Connect to backend to see real data.
          </p>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-amber-500 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">
            {greeting}, {user?.firstName || 'Chef'}!
          </h1>
          <p className="mt-2 text-primary-100 max-w-lg">
            Ready to create something delicious? Start by adding a new recipe or let AI generate one for you.
          </p>

          <div className="flex gap-3 mt-6">
            <Link to="/recipes/new?source=image">
              <Button
                variant="secondary"
                className="bg-white text-primary-600 hover:bg-primary-50"
              >
                <Plus className="w-4 h-4" />
                Add Recipe
              </Button>
            </Link>
            <Link to="/generate">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-8xl opacity-20">
          <ChefHat className="w-32 h-32" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-sm text-neutral-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Personalized Recommendations based on Flavor DNA */}
      {!USE_DEMO_DATA && <RecommendedRecipes limit={6} />}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Add a Recipe</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/recipes/new?source=instagram" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-pink-200 hover:-translate-y-0.5">
              <CardContent className="flex flex-col items-center text-center p-5 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
                  <Instagram className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Instagram</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Import from post or reel</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/youtube" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-red-200 hover:-translate-y-0.5">
              <CardContent className="flex flex-col items-center text-center p-5 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
                  <Youtube className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">YouTube</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Extract from video</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/recipes/new?source=image" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5">
              <CardContent className="flex flex-col items-center text-center p-5 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Scan Image</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Photo or screenshot</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/generate" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5">
              <CardContent className="flex flex-col items-center text-center p-5 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Wand2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">AI Generate</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">From your ingredients</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Recipes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Recent Recipes</h2>
          <Link
            to="/recipes"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} {...recipe} onVisibilityChange={handleVisibilityChange} />
          ))}
        </div>
      </section>

      {/* Meal Planning CTA */}
      <Card className="bg-gradient-to-r from-sage-50 to-cream-100 border-sage-200">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sage-500 flex items-center justify-center text-white text-2xl">
              📅
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Plan Your Week</h3>
              <p className="text-sm text-neutral-600">
                Organize your meals and create a shopping list automatically
              </p>
            </div>
          </div>
          <Link to="/meal-planner">
            <Button variant="primary" className="bg-sage-600 hover:bg-sage-700">
              Start Planning
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
