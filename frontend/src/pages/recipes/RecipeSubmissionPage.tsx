import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Type,
  Image,
  Link2,
  Camera,
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Upload,
  X,
  Instagram,
  Globe,
  Lock,
} from 'lucide-react';
import { Button, Card, Input, Badge, useToast } from '../../components/ui';
import { useCreateRecipe } from '../../hooks';
import { RecipeCategory, RecipeDifficulty, RecipeSource } from '../../types/recipe';
import type { CreateRecipeDto, RecipeComponent, Ingredient, Step } from '../../types/recipe';
import { aiService } from '../../services/recipe.service';

type SubmissionMode = 'text' | 'image' | 'url' | 'manual' | 'instagram';

const categories = Object.values(RecipeCategory).map((cat) => ({
  value: cat,
  label: cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' '),
}));

const difficulties = Object.values(RecipeDifficulty).map((diff) => ({
  value: diff,
  label: diff.charAt(0) + diff.slice(1).toLowerCase(),
}));

// Empty ingredient template
const emptyIngredient: Ingredient = {
  name: '',
  quantity: undefined,
  unit: '',
  notes: '',
  optional: false,
};

// Empty step template
const emptyStep: Step = {
  order: 1,
  instruction: '',
  duration: undefined,
  tips: '',
};

// Empty component template
const emptyComponent: RecipeComponent = {
  name: 'Main',
  ingredients: [{ ...emptyIngredient }],
  steps: [{ ...emptyStep }],
};

export function RecipeSubmissionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const createRecipe = useCreateRecipe();

  // Get source from URL query params
  const sourceParam = searchParams.get('source');

  // Map source param to initial mode
  const getInitialMode = (): SubmissionMode => {
    switch (sourceParam) {
      case 'instagram':
        return 'instagram';
      case 'image':
        return 'image';
      case 'url':
        return 'url';
      case 'text':
        return 'text';
      default:
        return 'manual';
    }
  };

  const [mode, setMode] = useState<SubmissionMode>(getInitialMode);
  const [isProcessing, setIsProcessing] = useState(false);

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
  const [components, setComponents] = useState<RecipeComponent[]>([{ ...emptyComponent }]);
  const [isPublic, setIsPublic] = useState(false);
  const [sourceAuthor, setSourceAuthor] = useState('');

  // Text input state
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');

  // Source tracking
  const [recipeSource, setRecipeSource] = useState<RecipeSource>(RecipeSource.TEXT);
  const [sourceUrl, setSourceUrl] = useState('');

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded sections
  const [expandedComponents, setExpandedComponents] = useState<Set<number>>(new Set([0]));

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

  // Add ingredient to component
  const addIngredient = (componentIndex: number) => {
    const newComponents = [...components];
    newComponents[componentIndex].ingredients.push({ ...emptyIngredient });
    setComponents(newComponents);
  };

  // Update ingredient
  const updateIngredient = (componentIndex: number, ingredientIndex: number, field: keyof Ingredient, value: any) => {
    const newComponents = [...components];
    newComponents[componentIndex].ingredients[ingredientIndex] = {
      ...newComponents[componentIndex].ingredients[ingredientIndex],
      [field]: value,
    };
    setComponents(newComponents);
  };

  // Remove ingredient
  const removeIngredient = (componentIndex: number, ingredientIndex: number) => {
    const newComponents = [...components];
    newComponents[componentIndex].ingredients.splice(ingredientIndex, 1);
    if (newComponents[componentIndex].ingredients.length === 0) {
      newComponents[componentIndex].ingredients.push({ ...emptyIngredient });
    }
    setComponents(newComponents);
  };

  // Add step to component
  const addStep = (componentIndex: number) => {
    const newComponents = [...components];
    const steps = newComponents[componentIndex].steps;
    steps.push({ ...emptyStep, order: steps.length + 1 });
    setComponents(newComponents);
  };

  // Update step
  const updateStep = (componentIndex: number, stepIndex: number, field: keyof Step, value: any) => {
    const newComponents = [...components];
    newComponents[componentIndex].steps[stepIndex] = {
      ...newComponents[componentIndex].steps[stepIndex],
      [field]: value,
    };
    setComponents(newComponents);
  };

  // Remove step
  const removeStep = (componentIndex: number, stepIndex: number) => {
    const newComponents = [...components];
    newComponents[componentIndex].steps.splice(stepIndex, 1);
    // Re-order remaining steps
    newComponents[componentIndex].steps.forEach((step, idx) => {
      step.order = idx + 1;
    });
    if (newComponents[componentIndex].steps.length === 0) {
      newComponents[componentIndex].steps.push({ ...emptyStep });
    }
    setComponents(newComponents);
  };

  // Add component
  const addComponent = () => {
    setComponents([...components, { name: `Section ${components.length + 1}`, ingredients: [{ ...emptyIngredient }], steps: [{ ...emptyStep }] }]);
    setExpandedComponents(new Set([...expandedComponents, components.length]));
  };

  // Remove component
  const removeComponent = (index: number) => {
    if (components.length === 1) return;
    const newComponents = [...components];
    newComponents.splice(index, 1);
    setComponents(newComponents);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning('Please enter a recipe title');
      return;
    }

    const recipeData: CreateRecipeDto = {
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
      source: recipeSource,
      sourceUrl: sourceUrl.trim() || undefined,
      sourceAuthor: sourceAuthor.trim() || undefined,
      isPublic,
      components: components.map((comp) => ({
        name: comp.name,
        ingredients: comp.ingredients.filter((ing) => ing.name.trim()),
        steps: comp.steps.filter((step) => step.instruction.trim()),
      })),
    };

    try {
      const recipe = await createRecipe.mutateAsync(recipeData);
      navigate(`/recipes/${recipe.id}`);
    } catch (err) {
      console.error('Failed to create recipe:', err);
      toast.error('Failed to create recipe. Please try again.');
    }
  };

  // Helper to populate form from parsed recipe
  const populateFormFromParsed = (parsed: any) => {
    setTitle(parsed.title || '');
    setDescription(parsed.description || '');
    setPrepTime(parsed.prepTimeMinutes || '');
    setCookTime(parsed.cookTimeMinutes || '');
    setServings(parsed.servings || 4);
    setDifficulty((parsed.difficulty as RecipeDifficulty) || '');
    setCategory((parsed.category as RecipeCategory) || '');
    setCuisine(parsed.cuisine || '');
    setTags(parsed.tags || []);
    setSourceAuthor(parsed.sourceAuthor || parsed.author || '');

    // Convert parsed components to form format
    if (parsed.components && parsed.components.length > 0) {
      const formComponents: RecipeComponent[] = parsed.components.map((comp: any) => ({
        name: comp.name || 'Main',
        ingredients: comp.ingredients.map((ing: any) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit || '',
          notes: ing.notes || '',
          optional: ing.optional || false,
        })),
        steps: comp.steps.map((step: any, idx: number) => ({
          order: step.order || idx + 1,
          instruction: step.instruction,
          duration: step.duration,
          tips: step.tips || '',
        })),
      }));
      setComponents(formComponents);
      setExpandedComponents(new Set([0]));
    }
  };

  // Process text input with AI parsing
  const handleProcessText = async () => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    try {
      const parsed = await aiService.parseRecipeFromText(textInput);
      populateFormFromParsed(parsed);
      setRecipeSource(RecipeSource.TEXT);
      setMode('manual');
    } catch (err) {
      console.error('Failed to parse recipe:', err);
      toast.error('Failed to parse recipe. Please try again or enter manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Detect recipe source type from URL
  const detectSourceFromUrl = (url: string): RecipeSource => {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase().replace('www.', '');

      if (hostname.includes('instagram.com') || hostname === 'instagr.am') {
        return RecipeSource.INSTAGRAM_URL;
      }
      if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('fb.watch')) {
        return RecipeSource.FACEBOOK_URL;
      }
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return RecipeSource.YOUTUBE;
      }
      if (parsedUrl.pathname.toLowerCase().endsWith('.pdf')) {
        return RecipeSource.PDF;
      }
      return RecipeSource.WEB_URL;
    } catch {
      return RecipeSource.URL;
    }
  };

  // Process URL input with AI extraction
  const handleProcessUrl = async () => {
    if (!urlInput.trim()) return;

    setIsProcessing(true);
    try {
      const parsed = await aiService.parseRecipeFromUrl(urlInput);
      populateFormFromParsed(parsed);

      // Set source tracking
      setSourceUrl(urlInput.trim());
      setRecipeSource(detectSourceFromUrl(urlInput.trim()));

      setMode('manual');
    } catch (err) {
      console.error('Failed to extract recipe from URL:', err);
      toast.error('Failed to extract recipe from URL. Please try again or enter manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle image file selection
  const handleImageSelect = useCallback((file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 20MB.');
      return;
    }

    setSelectedImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  // Clear selected image
  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process image with AI Vision
  const handleProcessImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      const parsed = await aiService.parseRecipeFromImage(selectedImage);
      populateFormFromParsed(parsed);
      setRecipeSource(RecipeSource.IMAGE);
      setMode('manual');
      clearSelectedImage();
    } catch (err) {
      console.error('Failed to parse recipe from image:', err);
      toast.error('Failed to parse recipe from image. Please try again or enter manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">
            {mode === 'instagram' ? 'Import from Instagram' : 'Add Recipe'}
          </h1>
          <p className="text-neutral-600">
            {mode === 'instagram'
              ? 'Extract a recipe from an Instagram post'
              : 'Create a new recipe from text, URL, or image'}
          </p>
        </div>
        {mode !== 'instagram' && (
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
      </div>

      {/* Mode Selection */}
      {mode !== 'manual' && mode !== 'instagram' && (
        <Card className="p-6">
          <h2 className="text-lg font-sans font-medium text-primary-700 mb-4">How would you like to add your recipe?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setMode('text')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                mode === 'text' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <Type className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="font-medium">Paste Text</p>
              <p className="text-xs text-neutral-500 mt-1">Paste recipe text</p>
            </button>
            <button
              onClick={() => setMode('url')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                mode === 'url' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <Link2 className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="font-medium">From URL</p>
              <p className="text-xs text-neutral-500 mt-1">Instagram, website</p>
            </button>
            <button
              onClick={() => setMode('image')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                mode === 'image' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <Image className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="font-medium">From Image</p>
              <p className="text-xs text-neutral-500 mt-1">Upload photo</p>
            </button>
            <button
              onClick={() => setMode('manual')}
              className="p-4 rounded-xl border-2 text-center transition-all border-neutral-200 hover:border-primary-300"
            >
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="font-medium">Manual Entry</p>
              <p className="text-xs text-neutral-500 mt-1">Type it yourself</p>
            </button>
          </div>
        </Card>
      )}

      {/* Text Input Mode */}
      {mode === 'text' && (
        <Card className="p-6">
          <h3 className="font-sans font-medium text-primary-700 mb-3">Paste your recipe</h3>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your recipe text here. Include ingredients, instructions, and any other details..."
            className="w-full h-64 p-4 border border-neutral-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setMode('manual')}>
              Enter Manually
            </Button>
            <Button onClick={handleProcessText} disabled={isProcessing || !textInput.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Process with AI
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* URL Input Mode */}
      {mode === 'url' && (
        <Card className="p-6">
          <h3 className="font-sans font-medium text-primary-700 mb-3">Enter recipe URL</h3>
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.instagram.com/p/... or any recipe URL"
          />
          <p className="text-sm text-neutral-500 mt-2">
            Supports: Instagram, YouTube descriptions, food blogs, recipe websites
          </p>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setMode('manual')}>
              Enter Manually
            </Button>
            <Button onClick={handleProcessUrl} disabled={isProcessing || !urlInput.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extract Recipe
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Instagram URL Input Mode */}
      {mode === 'instagram' && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-sans font-medium text-primary-700">Import from Instagram</h3>
              <p className="text-sm text-neutral-500">Paste an Instagram post URL to extract the recipe</p>
            </div>
          </div>

          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.instagram.com/p/ABC123..."
            className="text-lg"
          />

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800">
              <strong>Tip:</strong> For best results, paste the URL of an Instagram post that contains a recipe in its caption.
              The AI will extract ingredients and instructions from the caption text.
            </p>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleProcessUrl} disabled={isProcessing || !urlInput.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting Recipe...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extract Recipe
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Image Upload Mode */}
      {mode === 'image' && (
        <Card className="p-6">
          <h3 className="font-sans font-medium text-primary-700 mb-3">Upload recipe image</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Upload a photo of a recipe card, cookbook page, or handwritten recipe. AI will extract the recipe details.
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Drop zone or preview */}
          {!imagePreview ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-neutral-400'}`} />
              <p className="text-neutral-600 mb-2">
                {isDragging ? 'Drop image here' : 'Drag and drop an image here'}
              </p>
              <p className="text-sm text-neutral-500 mb-4">or click to browse</p>
              <Button variant="outline" type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <Image className="w-4 h-4" />
                Choose Image
              </Button>
              <p className="text-xs text-neutral-400 mt-4">
                Supported: JPEG, PNG, WebP, GIF (max 20MB)
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Image preview */}
              <div className="relative rounded-xl overflow-hidden bg-neutral-100">
                <img
                  src={imagePreview}
                  alt="Recipe preview"
                  className="w-full max-h-96 object-contain"
                />
                {/* Remove button */}
                <button
                  onClick={clearSelectedImage}
                  className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>
              {/* File info */}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-neutral-600">{selectedImage?.name}</span>
                <span className="text-neutral-400">
                  {selectedImage && (selectedImage.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => { clearSelectedImage(); setMode('manual'); }}>
              Enter Manually
            </Button>
            <Button onClick={handleProcessImage} disabled={isProcessing || !selectedImage}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extract Recipe
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Manual Entry Form */}
      {mode === 'manual' && (
        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6 space-y-4">
            <h3 className="font-sans font-medium text-lg text-primary-700">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Recipe Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Creamy Tuscan Chicken Pasta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Author / Chef
              </label>
              <Input
                value={sourceAuthor}
                onChange={(e) => setSourceAuthor(e.target.value)}
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
                  onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : '')}
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
                  onChange={(e) => setCookTime(e.target.value ? parseInt(e.target.value) : '')}
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
                  onChange={(e) => setServings(parseInt(e.target.value) || 4)}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as RecipeDifficulty)}
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
                  onChange={(e) => setCategory(e.target.value as RecipeCategory)}
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
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g., Italian, Mexican, Thai"
                />
              </div>
            </div>

            {/* Visibility Toggle */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Visibility
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    !isPublic
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span className="font-medium">Private</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    isPublic
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">Public</span>
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {isPublic
                  ? 'Anyone can view and fork this recipe'
                  : 'Only you can see this recipe'}
              </p>
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
            <Button onClick={handleSubmit} disabled={createRecipe.isPending || !title.trim()}>
              {createRecipe.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Recipe
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
