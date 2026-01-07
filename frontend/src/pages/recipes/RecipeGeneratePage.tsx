import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  X,
  Loader2,
  ChefHat,
  Utensils,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../../components/ui';
import { useCreateRecipe } from '../../hooks';
import { aiService } from '../../services/recipe.service';
import type { ParsedRecipe } from '../../services/recipe.service';
import { RecipeSource } from '../../types/recipe';

const cuisineOptions = [
  'Any', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai',
  'Mediterranean', 'French', 'American', 'Korean', 'Vietnamese', 'Greek',
];

const difficultyOptions = [
  { value: '', label: 'Any Difficulty' },
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const mealTypeOptions = [
  { value: '', label: 'Any Meal' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'dessert', label: 'Dessert' },
];

const dietaryOptions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb',
  'Nut-Free', 'Paleo', 'Whole30',
];

const commonIngredients = [
  'Chicken', 'Beef', 'Pork', 'Salmon', 'Shrimp', 'Tofu', 'Eggs',
  'Rice', 'Pasta', 'Potatoes', 'Bread',
  'Tomatoes', 'Onions', 'Garlic', 'Bell Peppers', 'Broccoli', 'Spinach', 'Mushrooms',
  'Cheese', 'Butter', 'Cream', 'Milk',
  'Olive Oil', 'Soy Sauce', 'Lemon', 'Lime',
];

export function RecipeGeneratePage() {
  const navigate = useNavigate();
  const createRecipe = useCreateRecipe();

  // Ingredients state
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');

  // Preferences state
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [mealType, setMealType] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<ParsedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add ingredient
  const addIngredient = (ingredient: string) => {
    const trimmed = ingredient.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput('');
    }
  };

  // Remove ingredient
  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
  };

  // Toggle dietary restriction
  const toggleDietary = (diet: string) => {
    if (dietary.includes(diet)) {
      setDietary(dietary.filter((d) => d !== diet));
    } else {
      setDietary([...dietary, diet]);
    }
  };

  // Generate recipe
  const handleGenerate = async () => {
    if (ingredients.length < 2) {
      setError('Please add at least 2 ingredients');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedRecipe(null);

    try {
      const recipe = await aiService.generateRecipe(ingredients, {
        cuisine: cuisine || undefined,
        difficulty: difficulty || undefined,
        dietary: dietary.length > 0 ? dietary : undefined,
        mealType: mealType || undefined,
      });
      setGeneratedRecipe(recipe);
    } catch (err) {
      console.error('Failed to generate recipe:', err);
      setError('Failed to generate recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated recipe
  const handleSaveRecipe = async () => {
    if (!generatedRecipe) return;

    try {
      const recipe = await createRecipe.mutateAsync({
        title: generatedRecipe.title,
        description: generatedRecipe.description,
        prepTimeMinutes: generatedRecipe.prepTimeMinutes,
        cookTimeMinutes: generatedRecipe.cookTimeMinutes,
        servings: generatedRecipe.servings,
        difficulty: generatedRecipe.difficulty as any,
        category: generatedRecipe.category as any,
        cuisine: generatedRecipe.cuisine,
        tags: generatedRecipe.tags,
        components: generatedRecipe.components,
        source: RecipeSource.GENERATED,
      });
      navigate(`/recipes/${recipe.id}`);
    } catch (err) {
      console.error('Failed to save recipe:', err);
      setError('Failed to save recipe. Please try again.');
    }
  };

  // Regenerate with same ingredients
  const handleRegenerate = () => {
    setGeneratedRecipe(null);
    handleGenerate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">Generate Recipe</h1>
          <p className="text-neutral-600">Create a custom recipe with AI based on your ingredients</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          {/* Ingredients */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary-500" />
              Your Ingredients
            </h3>

            {/* Add ingredient input */}
            <div className="flex gap-2 mb-4">
              <Input
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                placeholder="Add an ingredient..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addIngredient(ingredientInput);
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() => addIngredient(ingredientInput)}
                disabled={!ingredientInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Selected ingredients */}
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {ingredients.map((ingredient) => (
                  <Badge
                    key={ingredient}
                    variant="primary"
                    className="pl-3 pr-1 py-1 flex items-center gap-1"
                  >
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="p-0.5 hover:bg-primary-600 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Quick add suggestions */}
            <div>
              <p className="text-xs text-neutral-500 mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-1">
                {commonIngredients
                  .filter((i) => !ingredients.includes(i.toLowerCase()))
                  .slice(0, 12)
                  .map((ingredient) => (
                    <button
                      key={ingredient}
                      onClick={() => addIngredient(ingredient)}
                      className="px-2 py-1 text-xs bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-600 transition-colors"
                    >
                      + {ingredient}
                    </button>
                  ))}
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary-500" />
              Preferences (Optional)
            </h3>

            <div className="space-y-4">
              {/* Cuisine */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Cuisine
                </label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                >
                  {cuisineOptions.map((c) => (
                    <option key={c} value={c === 'Any' ? '' : c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty & Meal Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    {difficultyOptions.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Meal Type
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    {mealTypeOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Dietary Restrictions
                </label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((diet) => (
                    <button
                      key={diet}
                      onClick={() => toggleDietary(diet)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        dietary.includes(diet)
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={ingredients.length < 2 || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Recipe...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Recipe
              </>
            )}
          </Button>

          {ingredients.length < 2 && ingredients.length > 0 && (
            <p className="text-sm text-amber-600 text-center">
              Add at least 2 ingredients to generate a recipe
            </p>
          )}
        </div>

        {/* Right Column - Result */}
        <div>
          {/* Error */}
          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-red-600">{error}</p>
            </Card>
          )}

          {/* Loading State */}
          {isGenerating && (
            <Card className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Creating your recipe...</h3>
                <p className="text-neutral-500 text-sm">
                  Our AI chef is crafting something delicious with your ingredients
                </p>
              </div>
            </Card>
          )}

          {/* Generated Recipe Preview */}
          {generatedRecipe && !isGenerating && (
            <Card className="overflow-hidden">
              {/* Recipe Header */}
              <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                <h3 className="text-xl font-bold mb-2">{generatedRecipe.title}</h3>
                <p className="text-primary-100 text-sm">{generatedRecipe.description}</p>

                {/* Quick Stats */}
                <div className="flex gap-4 mt-4">
                  {generatedRecipe.prepTimeMinutes && (
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      Prep: {generatedRecipe.prepTimeMinutes}m
                    </div>
                  )}
                  {generatedRecipe.cookTimeMinutes && (
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      Cook: {generatedRecipe.cookTimeMinutes}m
                    </div>
                  )}
                  {generatedRecipe.servings && (
                    <div className="text-sm">
                      Serves: {generatedRecipe.servings}
                    </div>
                  )}
                </div>
              </div>

              {/* Recipe Content */}
              <div className="p-6 space-y-6">
                {/* Ingredients */}
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-3">Ingredients</h4>
                  <ul className="space-y-2">
                    {generatedRecipe.components[0]?.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                        <span>
                          {ing.quantity && <span className="font-medium">{ing.quantity} </span>}
                          {ing.unit && <span className="font-medium">{ing.unit} </span>}
                          {ing.name}
                          {ing.notes && <span className="text-neutral-500"> ({ing.notes})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-3">Instructions</h4>
                  <ol className="space-y-3">
                    {generatedRecipe.components[0]?.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-xs">
                          {step.order}
                        </span>
                        <div>
                          <p className="text-neutral-700">{step.instruction}</p>
                          {step.tips && (
                            <p className="text-amber-600 text-xs mt-1">Tip: {step.tips}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Tags */}
                {generatedRecipe.tags && generatedRecipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {generatedRecipe.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                <Button variant="outline" onClick={handleRegenerate} className="flex-1">
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
                <Button onClick={handleSaveRecipe} disabled={createRecipe.isPending} className="flex-1">
                  {createRecipe.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Save Recipe
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!generatedRecipe && !isGenerating && !error && (
            <Card className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">Ready to cook?</h3>
                <p className="text-neutral-500 text-sm">
                  Add your ingredients on the left and we'll generate a custom recipe just for you!
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
