import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Users,
  ChefHat,
  GitFork,
  ArrowLeft,
  ExternalLink,
  Share2,
  Loader2,
} from 'lucide-react';
import { Button, Badge, Card } from '../../components/ui';
import { ReactionBar } from '../../components/recipes/ReactionBar';
import { publicService, type PublicRecipe } from '../../services/public.service';
import { getImageUrl } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

// Hook to set document meta tags
function useDocumentMeta(recipe: PublicRecipe | undefined) {
  useEffect(() => {
    if (!recipe) return;

    const siteUrl = window.location.origin;
    const recipeUrl = `${siteUrl}/r/${recipe.id}`;
    const imageUrl = recipe.imageUrl ? getImageUrl(recipe.imageUrl) : `${siteUrl}/og-default.jpg`;
    const description = recipe.description || `A delicious ${recipe.cuisine || ''} recipe`;

    // Set title
    document.title = `${recipe.title} | GramGrab`;

    // Helper to set or create meta tag
    const setMeta = (property: string, content: string, isOg = false) => {
      const selector = isOg ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (isOg) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Set meta tags
    setMeta('description', description);
    setMeta('og:title', recipe.title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', imageUrl, true);
    setMeta('og:url', recipeUrl, true);
    setMeta('og:type', 'article', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', recipe.title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', imageUrl);

    // Cleanup on unmount
    return () => {
      document.title = 'GramGrab';
    };
  }, [recipe]);
}

const difficultyColors = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HARD: 'bg-orange-100 text-orange-700',
  EXPERT: 'bg-red-100 text-red-700',
};

const difficultyLabels = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  EXPERT: 'Expert',
};

export function PublicRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect authenticated users to the full recipe view
  useEffect(() => {
    if (isAuthenticated && id) {
      navigate(`/recipes/${id}`, { replace: true });
    }
  }, [isAuthenticated, id, navigate]);

  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['public-recipe', id],
    queryFn: () => publicService.getPublicRecipe(id!),
    enabled: !!id && !isAuthenticated, // Don't fetch if authenticated (will redirect)
  });

  // Set document meta tags for SEO
  useDocumentMeta(recipe);

  // If authenticated, show loading while redirect happens
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe?.title,
          text: recipe?.description || 'Check out this recipe!',
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Recipe Not Found</h1>
          <p className="text-gray-600 mb-4">
            This recipe may have been removed or made private.
          </p>
          <Link to="/login">
            <Button>Sign in to explore recipes</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-cream-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">GramGrab</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Link to="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Recipe Image */}
          {recipe.imageUrl && (
            <div className="relative rounded-xl overflow-hidden mb-6 aspect-video">
              <img
                src={getImageUrl(recipe.imageUrl)}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title and Meta */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {recipe.title}
            </h1>

            {/* Author */}
            <Link
              to="/login"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              {recipe.user.avatarUrl ? (
                <img
                  src={getImageUrl(recipe.user.avatarUrl)}
                  alt={`${recipe.user.firstName} ${recipe.user.lastName}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {recipe.user.firstName[0]}
                  </span>
                </div>
              )}
              <span className="font-medium">
                {recipe.user.firstName} {recipe.user.lastName}
              </span>
            </Link>

            {/* Description */}
            {recipe.description && (
              <p className="text-gray-600 mb-4">{recipe.description}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.difficulty && (
                <Badge className={difficultyColors[recipe.difficulty as keyof typeof difficultyColors]}>
                  <ChefHat className="w-3 h-3 mr-1" />
                  {difficultyLabels[recipe.difficulty as keyof typeof difficultyLabels]}
                </Badge>
              )}
              {recipe.cuisine && (
                <Badge variant="secondary">{recipe.cuisine}</Badge>
              )}
              {recipe.category && (
                <Badge variant="outline">{recipe.category}</Badge>
              )}
              {recipe.forkCount > 0 && (
                <Badge variant="outline">
                  <GitFork className="w-3 h-3 mr-1" />
                  {recipe.forkCount} fork{recipe.forkCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Time & Servings */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              {recipe.prepTimeMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Prep: {recipe.prepTimeMinutes} min</span>
                </div>
              )}
              {recipe.cookTimeMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Cook: {recipe.cookTimeMinutes} min</span>
                </div>
              )}
              {recipe.totalTimeMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span className="font-medium">Total: {recipe.totalTimeMinutes} min</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings} {recipe.servingUnit || 'servings'}</span>
                </div>
              )}
            </div>

            {/* Reactions */}
            <ReactionBar recipeId={recipe.id} className="mb-4" />

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recipe Content */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Ingredients */}
            <Card className="md:col-span-1 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Ingredients</h2>
              {recipe.components?.map((component, componentIndex) => (
                <div key={componentIndex} className="mb-4 last:mb-0">
                  {component.name && recipe.components && recipe.components.length > 1 && (
                    <h3 className="font-medium text-gray-700 mb-2">{component.name}</h3>
                  )}
                  <ul className="space-y-2">
                    {component.ingredients?.map((ingredient, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span className={ingredient.optional ? 'text-gray-500' : 'text-gray-700'}>
                          {ingredient.quantity && `${ingredient.quantity} `}
                          {ingredient.unit && `${ingredient.unit} `}
                          {ingredient.name}
                          {ingredient.optional && ' (optional)'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>

            {/* Instructions */}
            <Card className="md:col-span-2 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Instructions</h2>
              {recipe.components?.map((component, componentIndex) => (
                <div key={componentIndex} className="mb-6 last:mb-0">
                  {component.name && recipe.components && recipe.components.length > 1 && (
                    <h3 className="font-medium text-gray-700 mb-3">{component.name}</h3>
                  )}
                  <ol className="space-y-4">
                    {component.steps?.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="flex-shrink-0 w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                          {step.order || i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-700">{step.instruction}</p>
                          {step.duration && (
                            <span className="text-xs text-gray-500 mt-1 inline-flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {step.duration} min
                            </span>
                          )}
                          {step.tips && (
                            <p className="text-sm text-primary-600 mt-1 italic">
                              Tip: {step.tips}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </Card>
          </div>

          {/* Nutrition */}
          {recipe.nutrition && (
            <Card className="mt-6 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Nutrition (per serving)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recipe.nutrition.caloriesPerServing && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {recipe.nutrition.caloriesPerServing}
                    </div>
                    <div className="text-sm text-gray-500">Calories</div>
                  </div>
                )}
                {recipe.nutrition.proteinGrams && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {recipe.nutrition.proteinGrams}g
                    </div>
                    <div className="text-sm text-gray-500">Protein</div>
                  </div>
                )}
                {recipe.nutrition.carbsGrams && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {recipe.nutrition.carbsGrams}g
                    </div>
                    <div className="text-sm text-gray-500">Carbs</div>
                  </div>
                )}
                {recipe.nutrition.fatGrams && (
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {recipe.nutrition.fatGrams}g
                    </div>
                    <div className="text-sm text-gray-500">Fat</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Source */}
          {recipe.sourceUrl && (
            <Card className="mt-6 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Source</h2>
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                {recipe.sourceAuthor || recipe.sourceUrl}
                <ExternalLink className="w-4 h-4" />
              </a>
            </Card>
          )}

          {/* CTA for non-authenticated users */}
          <Card className="mt-8 p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center">
            <h2 className="text-xl font-bold mb-2">Want to save this recipe?</h2>
            <p className="mb-4 opacity-90">
              Sign up for GramGrab to save, organize, and cook your favorite recipes.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Create Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </Card>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12 py-6">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>Powered by GramGrab - Your recipe collection, organized.</p>
          </div>
        </footer>
      </div>
  );
}

export default PublicRecipePage;
