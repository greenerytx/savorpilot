import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  FlaskConical,
  Sparkles,
  ChefHat,
  ArrowRight,
  X,
  Loader2,
  Clock,
  Users,
  Zap,
  Scale,
  Beaker,
} from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { useRecipes } from '../../hooks';
import { aiService, recipeService } from '../../services/recipe.service';
import { getImageUrl } from '../../lib/utils';
import type { Recipe } from '../../types/recipe';

type FusionStyle = 'balanced' | 'recipe1-dominant' | 'recipe2-dominant' | 'experimental';

const fusionStyles: { value: FusionStyle; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'balanced',
    label: 'Balanced Fusion',
    description: 'Equal blend of both recipes',
    icon: <Scale className="w-5 h-5" />,
  },
  {
    value: 'recipe1-dominant',
    label: 'Recipe 1 Base',
    description: 'Recipe 1 as base, elements from Recipe 2',
    icon: <ArrowRight className="w-5 h-5" />,
  },
  {
    value: 'recipe2-dominant',
    label: 'Recipe 2 Base',
    description: 'Recipe 2 as base, elements from Recipe 1',
    icon: <ArrowRight className="w-5 h-5 rotate-180" />,
  },
  {
    value: 'experimental',
    label: 'Experimental',
    description: 'Creative and surprising combinations',
    icon: <Beaker className="w-5 h-5" />,
  },
];

interface RecipeCardMiniProps {
  recipe: Recipe;
  onRemove: () => void;
  label: string;
}

function RecipeCardMini({ recipe, onRemove, label }: RecipeCardMiniProps) {
  return (
    <div className="relative bg-white rounded-xl border border-primary-200 overflow-hidden">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
      >
        <X className="w-4 h-4 text-neutral-500 hover:text-red-500" />
      </button>
      <div className="flex gap-3 p-3">
        {recipe.imageUrl ? (
          <img
            src={getImageUrl(recipe.imageUrl)}
            alt={recipe.title}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-8 h-8 text-primary-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-primary-500 uppercase tracking-wide">{label}</span>
          <h4 className="font-semibold text-neutral-900 truncate">{recipe.title}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
            {recipe.cuisine && <span>{recipe.cuisine}</span>}
            {recipe.cuisine && recipe.category && <span>-</span>}
            {recipe.category && <span>{recipe.category}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FusionLabPage() {
  const navigate = useNavigate();
  const [recipe1, setRecipe1] = useState<Recipe | null>(null);
  const [recipe2, setRecipe2] = useState<Recipe | null>(null);
  const [fusionStyle, setFusionStyle] = useState<FusionStyle>('balanced');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecipeSelector, setShowRecipeSelector] = useState<1 | 2 | null>(null);

  const { data: recipesData, isLoading: recipesLoading } = useRecipes({
    search: searchQuery || undefined,
    limit: 20,
  });

  const fusionMutation = useMutation({
    mutationFn: async () => {
      if (!recipe1 || !recipe2) throw new Error('Please select two recipes');
      return aiService.createFusionRecipe(recipe1.id, recipe2.id, fusionStyle);
    },
    onSuccess: async (fusionRecipe) => {
      // Create the recipe
      const created = await recipeService.createRecipe({
        title: fusionRecipe.title,
        description: fusionRecipe.description || undefined,
        servings: fusionRecipe.servings || undefined,
        prepTimeMinutes: fusionRecipe.prepTimeMinutes || undefined,
        cookTimeMinutes: fusionRecipe.cookTimeMinutes || undefined,
        difficulty: fusionRecipe.difficulty as any,
        category: fusionRecipe.category as any,
        cuisine: fusionRecipe.cuisine || undefined,
        tags: fusionRecipe.tags || [],
        components: fusionRecipe.components,
        notes: fusionRecipe.fusionNotes
          ? `Fusion of: ${fusionRecipe.parentRecipes?.join(' + ')}\n\n${fusionRecipe.fusionNotes}`
          : undefined,
      });
      navigate(`/recipes/${created.id}`);
    },
  });

  const handleSelectRecipe = (recipe: Recipe) => {
    if (showRecipeSelector === 1) {
      setRecipe1(recipe);
    } else if (showRecipeSelector === 2) {
      setRecipe2(recipe);
    }
    setShowRecipeSelector(null);
    setSearchQuery('');
  };

  const availableRecipes = recipesData?.data.filter(
    (r) => r.id !== recipe1?.id && r.id !== recipe2?.id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
          <FlaskConical className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Fusion Lab</h1>
          <p className="text-neutral-500">Merge two recipes into a creative fusion dish</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recipe Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Select Two Recipes</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Recipe 1 Slot */}
              <div>
                {recipe1 ? (
                  <RecipeCardMini
                    recipe={recipe1}
                    onRemove={() => setRecipe1(null)}
                    label="Recipe 1"
                  />
                ) : (
                  <button
                    onClick={() => setShowRecipeSelector(1)}
                    className="w-full h-28 border-2 border-dashed border-primary-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <ChefHat className="w-8 h-8 text-primary-400" />
                    <span className="text-sm font-medium text-primary-600">Select Recipe 1</span>
                  </button>
                )}
              </div>

              {/* Fusion Icon */}
              <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Recipe 2 Slot */}
              <div>
                {recipe2 ? (
                  <RecipeCardMini
                    recipe={recipe2}
                    onRemove={() => setRecipe2(null)}
                    label="Recipe 2"
                  />
                ) : (
                  <button
                    onClick={() => setShowRecipeSelector(2)}
                    className="w-full h-28 border-2 border-dashed border-primary-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <ChefHat className="w-8 h-8 text-primary-400" />
                    <span className="text-sm font-medium text-primary-600">Select Recipe 2</span>
                  </button>
                )}
              </div>
            </div>

            {/* Recipe Selector Modal */}
            {showRecipeSelector && (
              <div className="mt-4 border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-neutral-900">
                    Select Recipe {showRecipeSelector}
                  </h3>
                  <button
                    onClick={() => {
                      setShowRecipeSelector(null);
                      setSearchQuery('');
                    }}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search your recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-3"
                />

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {recipesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    </div>
                  ) : availableRecipes && availableRecipes.length > 0 ? (
                    availableRecipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        onClick={() => handleSelectRecipe(recipe)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 transition-colors text-left"
                      >
                        {recipe.imageUrl ? (
                          <img
                            src={getImageUrl(recipe.imageUrl)}
                            alt={recipe.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                            <ChefHat className="w-6 h-6 text-primary-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">{recipe.title}</p>
                          <p className="text-xs text-neutral-500">
                            {recipe.cuisine || recipe.category || 'Recipe'}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      {searchQuery ? 'No recipes found' : 'No recipes available'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Fusion Style */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Fusion Style</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {fusionStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setFusionStyle(style.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    fusionStyle === style.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                      fusionStyle === style.value
                        ? 'bg-purple-500 text-white'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {style.icon}
                  </div>
                  <p className="font-medium text-neutral-900 text-sm">{style.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{style.description}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar - Preview & Action */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Fusion Preview</h2>

            {recipe1 && recipe2 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-300 mx-auto">
                      {recipe1.imageUrl ? (
                        <img
                          src={getImageUrl(recipe1.imageUrl)}
                          alt={recipe1.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                          <ChefHat className="w-6 h-6 text-primary-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 max-w-[80px] truncate mx-auto">
                      {recipe1.title}
                    </p>
                  </div>

                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-300 mx-auto">
                      {recipe2.imageUrl ? (
                        <img
                          src={getImageUrl(recipe2.imageUrl)}
                          alt={recipe2.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                          <ChefHat className="w-6 h-6 text-primary-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 max-w-[80px] truncate mx-auto">
                      {recipe2.title}
                    </p>
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-4">
                  <p className="text-sm text-neutral-600 text-center mb-4">
                    Ready to create a <span className="font-medium text-purple-600">{fusionStyle}</span> fusion
                    of these two recipes!
                  </p>

                  <Button
                    onClick={() => fusionMutation.mutate()}
                    disabled={fusionMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {fusionMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Fusion...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Fusion Recipe
                      </>
                    )}
                  </Button>

                  {fusionMutation.isError && (
                    <p className="text-sm text-red-500 text-center mt-2">
                      {fusionMutation.error?.message || 'Failed to create fusion'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FlaskConical className="w-8 h-8 text-neutral-300" />
                </div>
                <p className="text-neutral-500 text-sm">
                  Select two recipes to preview your fusion
                </p>
              </div>
            )}
          </Card>

          {/* Tips */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Fusion Tips
            </h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">-</span>
                Combine cuisines with similar base ingredients
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">-</span>
                Mix comfort foods for familiar-yet-new dishes
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">-</span>
                Try contrasting textures (crispy + creamy)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">-</span>
                Experiment with sweet + savory combinations
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default FusionLabPage;
