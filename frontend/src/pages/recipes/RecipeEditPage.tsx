import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Input, Badge, useToast } from '../../components/ui';
import { useRecipe, useUpdateRecipe } from '../../hooks';
import { RecipeCategory, RecipeDifficulty } from '../../types/recipe';
import type { UpdateRecipeDto, RecipeComponent, Ingredient, Step } from '../../types/recipe';

const categories = Object.values(RecipeCategory).map((cat) => ({
  value: cat,
  label: cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' '),
}));

const difficulties = Object.values(RecipeDifficulty).map((diff) => ({
  value: diff,
  label: diff.charAt(0) + diff.slice(1).toLowerCase(),
}));

const emptyIngredient: Ingredient = {
  name: '',
  quantity: undefined,
  unit: '',
  notes: '',
  optional: false,
};

const emptyStep: Step = {
  order: 1,
  instruction: '',
  duration: undefined,
  tips: '',
};

export function RecipeEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data: recipe, isLoading, error } = useRecipe(id || '');
  const updateRecipe = useUpdateRecipe();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [prepTime, setPrepTime] = useState<number | ''>('');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [servings, setServings] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | ''>('');
  const [category, setCategory] = useState<RecipeCategory | ''>('');
  const [cuisine, setCuisine] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [components, setComponents] = useState<RecipeComponent[]>([]);
  const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set([0]));
  const [hasChanges, setHasChanges] = useState(false);
  const [sourceAuthor, setSourceAuthor] = useState('');

  // Populate form when recipe loads
  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setDescription(recipe.description || '');
      setImageUrl(recipe.imageUrl || '');
      setPrepTime(recipe.prepTimeMinutes || '');
      setCookTime(recipe.cookTimeMinutes || '');
      setServings(recipe.servings || 4);
      setDifficulty((recipe.difficulty as RecipeDifficulty) || '');
      setCategory((recipe.category as RecipeCategory) || '');
      setCuisine(recipe.cuisine || '');
      setTags(recipe.tags || []);
      setSourceAuthor(recipe.sourceAuthor || '');
      setComponents(recipe.components.length > 0 ? recipe.components : [{
        name: 'Main',
        ingredients: [{ ...emptyIngredient }],
        steps: [{ ...emptyStep }],
      }]);
      setExpandedComponents(new Set([0]));
      setHasChanges(false);
    }
  }, [recipe]);

  // Track changes
  const markChanged = () => setHasChanges(true);

  // Toggle component expansion
  const toggleComponent = (index: number) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedComponents(newExpanded);
  };

  // Ingredient handlers
  const addIngredient = (componentIndex: number) => {
    const newComponents = [...components];
    newComponents[componentIndex].ingredients.push({ ...emptyIngredient });
    setComponents(newComponents);
    markChanged();
  };

  const updateIngredient = (componentIndex: number, ingredientIndex: number, field: keyof Ingredient, value: any) => {
    const newComponents = [...components];
    newComponents[componentIndex].ingredients[ingredientIndex] = {
      ...newComponents[componentIndex].ingredients[ingredientIndex],
      [field]: value,
    };
    setComponents(newComponents);
    markChanged();
  };

  const removeIngredient = (componentIndex: number, ingredientIndex: number) => {
    const newComponents = [...components];
    newComponents[componentIndex].ingredients.splice(ingredientIndex, 1);
    if (newComponents[componentIndex].ingredients.length === 0) {
      newComponents[componentIndex].ingredients.push({ ...emptyIngredient });
    }
    setComponents(newComponents);
    markChanged();
  };

  // Step handlers
  const addStep = (componentIndex: number) => {
    const newComponents = [...components];
    const steps = newComponents[componentIndex].steps;
    steps.push({ ...emptyStep, order: steps.length + 1 });
    setComponents(newComponents);
    markChanged();
  };

  const updateStep = (componentIndex: number, stepIndex: number, field: keyof Step, value: any) => {
    const newComponents = [...components];
    newComponents[componentIndex].steps[stepIndex] = {
      ...newComponents[componentIndex].steps[stepIndex],
      [field]: value,
    };
    setComponents(newComponents);
    markChanged();
  };

  const removeStep = (componentIndex: number, stepIndex: number) => {
    const newComponents = [...components];
    newComponents[componentIndex].steps.splice(stepIndex, 1);
    newComponents[componentIndex].steps.forEach((step, idx) => {
      step.order = idx + 1;
    });
    if (newComponents[componentIndex].steps.length === 0) {
      newComponents[componentIndex].steps.push({ ...emptyStep });
    }
    setComponents(newComponents);
    markChanged();
  };

  // Component handlers
  const addComponent = () => {
    setComponents([...components, {
      name: `Section ${components.length + 1}`,
      ingredients: [{ ...emptyIngredient }],
      steps: [{ ...emptyStep }]
    }]);
    setExpandedComponents(new Set([...expandedComponents, components.length]));
    markChanged();
  };

  const removeComponent = (index: number) => {
    if (components.length === 1) return;
    const newComponents = [...components];
    newComponents.splice(index, 1);
    setComponents(newComponents);
    markChanged();
  };

  // Tag handlers
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
      markChanged();
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    markChanged();
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!title.trim() || !id) {
      toast.warning('Please enter a recipe title');
      return;
    }

    const recipeData: UpdateRecipeDto = {
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      prepTimeMinutes: prepTime || undefined,
      cookTimeMinutes: cookTime || undefined,
      servings,
      difficulty: difficulty || undefined,
      category: category || undefined,
      cuisine: cuisine.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      sourceAuthor: sourceAuthor.trim() || undefined,
      components: components.map((comp) => ({
        name: comp.name,
        ingredients: comp.ingredients.filter((ing) => ing.name.trim()),
        steps: comp.steps.filter((step) => step.instruction.trim()),
      })),
    };

    try {
      await updateRecipe.mutateAsync({ id, data: recipeData });
      navigate(`/recipes/${id}`);
    } catch (err) {
      console.error('Failed to update recipe:', err);
      toast.error('Failed to update recipe. Please try again.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Recipe Not Found</h2>
          <p className="text-neutral-600 mb-4">The recipe you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Button onClick={() => navigate('/recipes')}>
            Back to Recipes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">Edit Recipe</h1>
          <p className="text-neutral-600">Update your recipe details</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">You have unsaved changes</span>
        </div>
      )}

      {/* Basic Info */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg text-neutral-900">Basic Information</h3>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Recipe Title *
          </label>
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markChanged(); }}
            placeholder="e.g., Creamy Tuscan Chicken Pasta"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); markChanged(); }}
            placeholder="A brief description of your recipe..."
            className="w-full p-3 border border-neutral-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Image URL
          </label>
          <Input
            value={imageUrl}
            onChange={(e) => { setImageUrl(e.target.value); markChanged(); }}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Author / Chef
          </label>
          <Input
            value={sourceAuthor}
            onChange={(e) => { setSourceAuthor(e.target.value); markChanged(); }}
            placeholder="e.g., Gordon Ramsay, @foodblogger"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Prep Time (min)
            </label>
            <Input
              type="number"
              value={prepTime}
              onChange={(e) => { setPrepTime(e.target.value ? parseInt(e.target.value) : ''); markChanged(); }}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cook Time (min)
            </label>
            <Input
              type="number"
              value={cookTime}
              onChange={(e) => { setCookTime(e.target.value ? parseInt(e.target.value) : ''); markChanged(); }}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Servings
            </label>
            <Input
              type="number"
              value={servings}
              onChange={(e) => { setServings(parseInt(e.target.value) || 4); markChanged(); }}
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => { setDifficulty(e.target.value as RecipeDifficulty); markChanged(); }}
              className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select...</option>
              {difficulties.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value as RecipeCategory); markChanged(); }}
              className="w-full p-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cuisine
            </label>
            <Input
              value={cuisine}
              onChange={(e) => { setCuisine(e.target.value); markChanged(); }}
              placeholder="e.g., Italian, Mexican, Thai"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Tags
          </label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button variant="outline" onClick={addTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="pr-1">
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 p-0.5 hover:bg-neutral-300 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Components (Ingredients & Steps) */}
      {components.map((component, compIdx) => (
        <Card key={compIdx} className="overflow-hidden">
          {/* Component Header */}
          <div
            className="flex items-center justify-between p-4 bg-neutral-50 cursor-pointer"
            onClick={() => toggleComponent(compIdx)}
          >
            <div className="flex items-center gap-3">
              <GripVertical className="w-5 h-5 text-neutral-400" />
              <input
                value={component.name}
                onChange={(e) => {
                  const newComponents = [...components];
                  newComponents[compIdx].name = e.target.value;
                  setComponents(newComponents);
                  markChanged();
                }}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-neutral-900 bg-transparent border-none focus:ring-0 p-0"
              />
              <Badge variant="secondary">
                {component.ingredients.filter((i) => i.name).length} ingredients
              </Badge>
              <Badge variant="secondary">
                {component.steps.filter((s) => s.instruction).length} steps
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {components.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeComponent(compIdx);
                  }}
                  className="p-1 text-neutral-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {expandedComponents.has(compIdx) ? (
                <ChevronUp className="w-5 h-5 text-neutral-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-neutral-400" />
              )}
            </div>
          </div>

          {/* Component Content */}
          {expandedComponents.has(compIdx) && (
            <div className="p-6 space-y-6">
              {/* Ingredients */}
              <div>
                <h4 className="font-medium text-neutral-900 mb-3">Ingredients</h4>
                <div className="space-y-2">
                  {component.ingredients.map((ingredient, ingIdx) => (
                    <div key={ingIdx} className="flex gap-2 items-start">
                      <Input
                        type="number"
                        value={ingredient.quantity || ''}
                        onChange={(e) => updateIngredient(compIdx, ingIdx, 'quantity', e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="Qty"
                        className="w-20"
                      />
                      <Input
                        value={ingredient.unit || ''}
                        onChange={(e) => updateIngredient(compIdx, ingIdx, 'unit', e.target.value)}
                        placeholder="Unit"
                        className="w-24"
                      />
                      <Input
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(compIdx, ingIdx, 'name', e.target.value)}
                        placeholder="Ingredient name"
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeIngredient(compIdx, ingIdx)}
                        className="p-2 text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => addIngredient(compIdx)} className="mt-2">
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </Button>
              </div>

              {/* Steps */}
              <div>
                <h4 className="font-medium text-neutral-900 mb-3">Instructions</h4>
                <div className="space-y-3">
                  {component.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-sm">
                        {step.order}
                      </div>
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={step.instruction}
                          onChange={(e) => updateStep(compIdx, stepIdx, 'instruction', e.target.value)}
                          placeholder="Describe this step..."
                          className="w-full p-2 border border-neutral-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={step.duration || ''}
                            onChange={(e) => updateStep(compIdx, stepIdx, 'duration', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Duration (min)"
                            className="w-32"
                          />
                          <Input
                            value={step.tips || ''}
                            onChange={(e) => updateStep(compIdx, stepIdx, 'tips', e.target.value)}
                            placeholder="Tips (optional)"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeStep(compIdx, stepIdx)}
                        className="p-2 text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => addStep(compIdx)} className="mt-2">
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}

      {/* Add Component Button */}
      <Button variant="outline" onClick={addComponent} className="w-full">
        <Plus className="w-4 h-4" />
        Add Section (e.g., Sauce, Marinade)
      </Button>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={updateRecipe.isPending || !title.trim()}>
          {updateRecipe.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
