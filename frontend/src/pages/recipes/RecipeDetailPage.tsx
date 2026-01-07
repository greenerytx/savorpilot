import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  Users,
  ChefHat,
  Edit,
  Timer,
  Plus,
  Minus,
  Check,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Languages,
  GitFork,
  Globe,
  Lock,
  Instagram,
  Youtube,
  Facebook,
  Link2,
  FileText,
  Image,
  FileType,
  Wand2,
  Trash2,
  Flame,
  Utensils,
  MessageSquare,
  FilePen,
  Star,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Badge, Card, useConfirm, useToast, UnitToggle } from '../../components/ui';
import { useUnitPreferencesStore, type UnitDisplaySystem } from '../../stores/unitPreferencesStore';
import { formatIngredientDisplay, canConvert, convertQuantityWithIngredient, formatQuantity } from '../../utils/unitConversion';
import { ShareModal } from '../../components/sharing';
import { NutritionCard, AddToCollectionModal, ForkBadge, ForkModal, RecipeDiffModal, ForksList, ChatAssistant, MadeItModal, CircleCompatibilityCard, PersonalAllergenWarning, PrintSettingsModal, ShareCardModal, OptionAActionBar, RecipeGenealogyTree } from '../../components/recipes';
import { CommentSection } from '../../components/comments';
import { useRecipe, useDeleteRecipe, useDownloadImage, useDownloadVideo, useTranslateRecipe, useRecipeTranslations, recipeKeys, useForkRecipe, useRecipeLineage, useRecipeComparison, useUpdateRecipeVisibility, useTrackRecipeView, useRecipeActions } from '../../hooks';
import { aiService } from '../../services/recipe.service';
import { isExtensionAvailable, pingExtension, refreshVideoViaExtension } from '../../services/extension.service';
import type { NutritionEstimate, RecipeTranslations } from '../../services/recipe.service';
import { RecipeDifficulty, RecipeCategory, RecipeVisibility } from '../../types/recipe';
import type { Recipe } from '../../types/recipe';
import { getImageUrl, cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

// Demo mode flag
const USE_DEMO_DATA = false;

// Demo recipe for preview
const demoRecipe: Recipe = {
  id: '1',
  userId: 'demo',
  title: 'Creamy Tuscan Chicken Pasta',
  description: 'A rich and creamy pasta dish with sun-dried tomatoes, spinach, and tender chicken in a garlic parmesan sauce. Perfect for a cozy weeknight dinner.',
  imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=1200',
  prepTimeMinutes: 15,
  cookTimeMinutes: 25,
  totalTimeMinutes: 40,
  servings: 4,
  servingUnit: 'servings',
  difficulty: RecipeDifficulty.MEDIUM,
  category: RecipeCategory.DINNER,
  cuisine: 'Italian',
  tags: ['pasta', 'chicken', 'creamy', 'italian', 'comfort food'],
  source: 'TEXT' as any,
  sourceAuthor: '@italian_kitchen',
  components: [
    {
      name: 'Main',
      ingredients: [
        { quantity: 1, unit: 'lb', name: 'penne pasta', optional: false },
        { quantity: 1.5, unit: 'lbs', name: 'chicken breast, cubed', optional: false },
        { quantity: 2, unit: 'tbsp', name: 'olive oil', optional: false },
        { quantity: 4, unit: 'cloves', name: 'garlic, minced', optional: false },
        { quantity: 1, unit: 'cup', name: 'sun-dried tomatoes, drained', optional: false },
        { quantity: 3, unit: 'cups', name: 'fresh spinach', optional: false },
        { quantity: 1.5, unit: 'cups', name: 'heavy cream', optional: false },
        { quantity: 0.75, unit: 'cup', name: 'parmesan cheese, grated', optional: false },
        { quantity: 1, unit: 'tsp', name: 'Italian seasoning', optional: false },
        { name: 'Salt and pepper to taste', optional: false },
      ],
      steps: [
        { order: 1, instruction: 'Cook pasta according to package directions. Drain and set aside, reserving 1/2 cup pasta water.', duration: 10 },
        { order: 2, instruction: 'Season chicken with salt, pepper, and Italian seasoning. Heat olive oil in a large skillet over medium-high heat.', duration: 2 },
        { order: 3, instruction: 'Cook chicken until golden brown and cooked through, about 6-7 minutes. Remove and set aside.', duration: 7 },
        { order: 4, instruction: 'In the same skillet, add garlic and sauté for 30 seconds until fragrant.', duration: 1 },
        { order: 5, instruction: 'Add sun-dried tomatoes and cook for 2 minutes.', duration: 2 },
        { order: 6, instruction: 'Pour in heavy cream and bring to a simmer. Add parmesan cheese and stir until melted.', duration: 3 },
        { order: 7, instruction: 'Add spinach and cook until wilted, about 2 minutes.', duration: 2 },
        { order: 8, instruction: 'Return chicken to the skillet. Add cooked pasta and toss to combine. Add pasta water if needed.', duration: 2 },
        { order: 9, instruction: 'Season with salt and pepper. Serve immediately with extra parmesan.', tips: 'Garnish with fresh basil for extra flavor.' },
      ],
    },
  ],
  nutrition: {
    caloriesPerServing: 650,
    proteinGrams: 42,
    carbsGrams: 48,
    fatGrams: 32,
  },
  notes: {
    personalNotes: 'Kids love this! Try adding mushrooms next time.',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  forkCount: 0,
  visibility: 'PRIVATE',
};

// Difficulty colors
const difficultyColors: Record<RecipeDifficulty, string> = {
  [RecipeDifficulty.EASY]: 'bg-mint-100 text-mint-700',
  [RecipeDifficulty.MEDIUM]: 'bg-butter-100 text-butter-700',
  [RecipeDifficulty.HARD]: 'bg-coral-100 text-coral-700',
  [RecipeDifficulty.EXPERT]: 'bg-terracotta-100 text-terracotta-700',
};

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const toast = useToast();

  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  // Unit conversion - default to 'original' to preserve recipe's original units
  const { setRecipePageOverride } = useUnitPreferencesStore();
  const [unitDisplay, setUnitDisplay] = useState<UnitDisplaySystem>('original');
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'nutrition' | 'notes' | 'forks' | 'comments'>('ingredients');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [isEstimatingNutrition, setIsEstimatingNutrition] = useState(false);
  const [estimatedNutrition, setEstimatedNutrition] = useState<NutritionEstimate | null>(null);
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showForkModal, setShowForkModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showMadeItModal, setShowMadeItModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showShareCardModal, setShowShareCardModal] = useState(false);

  const queryClient = useQueryClient();
  const translateRecipe = useTranslateRecipe();

  // Get prev/next recipe navigation from session storage
  const getAdjacentRecipes = () => {
    try {
      const storedIds = sessionStorage.getItem('recipeListIds');
      if (!storedIds || !id) return { prevId: null, nextId: null };

      const recipeIds: string[] = JSON.parse(storedIds);
      const currentIndex = recipeIds.indexOf(id);

      if (currentIndex === -1) return { prevId: null, nextId: null };

      return {
        prevId: currentIndex > 0 ? recipeIds[currentIndex - 1] : null,
        nextId: currentIndex < recipeIds.length - 1 ? recipeIds[currentIndex + 1] : null,
      };
    } catch {
      return { prevId: null, nextId: null };
    }
  };

  const { prevId, nextId } = getAdjacentRecipes();

  // Fetch recipe from API (only when not in demo mode)
  const { data: apiRecipe, isLoading, error } = useRecipe(USE_DEMO_DATA ? '' : (id || ''));
  const deleteRecipe = useDeleteRecipe();
  const downloadImage = useDownloadImage();
  const downloadVideo = useDownloadVideo();
  const { data: translations, isLoading: isLoadingTranslations } = useRecipeTranslations(id || '');

  // Fork hooks
  const forkRecipe = useForkRecipe();
  const { data: lineage } = useRecipeLineage(id || '');
  const { data: comparisonDiff, isLoading: isLoadingDiff } = useRecipeComparison(
    apiRecipe?.parentRecipeId || '',
    id || '',
    showDiffModal && !!apiRecipe?.parentRecipeId
  );

  // Visibility hook
  const updateVisibility = useUpdateRecipeVisibility();

  // Flavor DNA tracking hooks
  useTrackRecipeView(id, !USE_DEMO_DATA && !!id); // Track page views
  const recipeActions = useRecipeActions(id || '');

  // Use demo or API data
  const recipe = USE_DEMO_DATA ? demoRecipe : apiRecipe;

  // Check if current user is the owner
  const { user: currentUser } = useAuthStore();
  const isOwner = recipe?.userId === currentUser?.id;

  // Handle translate recipe
  const handleTranslate = async () => {
    if (!id) return;
    try {
      await translateRecipe.mutateAsync(id);
      setShowTranslations(true);
      toast.success('Recipe translated to English and Arabic!');
    } catch (err) {
      console.error('Failed to translate recipe:', err);
      toast.error('Failed to translate recipe. Please try again.');
    }
  };

  // Check if image is external (not stored locally)
  const isExternalImage = recipe?.imageUrl?.startsWith('http') && !recipe?.imageUrl?.includes('/uploads/');

  // Handle download image
  const handleDownloadImage = async () => {
    if (!recipe || !recipe.imageUrl || !isExternalImage) return;

    try {
      await downloadImage.mutateAsync({
        recipeId: recipe.id,
        imageUrl: recipe.imageUrl,
      });
      toast.success('Image saved locally!');
    } catch (err) {
      console.error('Failed to download image:', err);
      toast.error('Failed to save image. Please try again.');
    }
  };

  // State for video refresh via extension
  const [isRefreshingVideo, setIsRefreshingVideo] = useState(false);
  const [videoRefreshKey, setVideoRefreshKey] = useState(0); // Force video element remount

  // State for AI image generation
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  // Handle download video (uses extension to refresh from Instagram)
  const handleDownloadVideo = async () => {
    if (!recipe || !recipe.sourceUrl) return;

    // Extract shortcode from source URL
    const shortcodeMatch = recipe.sourceUrl.match(/\/(p|reel|reels)\/([A-Za-z0-9_-]+)/);
    if (!shortcodeMatch) {
      toast.error('Could not extract Instagram post ID from source URL.');
      return;
    }
    const shortcode = shortcodeMatch[2];

    setIsRefreshingVideo(true);

    // Check if extension is available (try both methods)
    const extensionAvailable = isExtensionAvailable() || await pingExtension();
    if (!extensionAvailable) {
      setIsRefreshingVideo(false);
      toast.error('SavorPilot extension not detected. Please install the extension and refresh the page.');
      return;
    }

    try {
      const result = await refreshVideoViaExtension(recipe.id, shortcode);

      if (result.success) {
        setVideoError(false); // Reset error state so video player shows again
        // Force refetch the recipe query to get new video URL
        await queryClient.refetchQueries({ queryKey: recipeKeys.detail(recipe.id) });
        // Increment key to force video element to remount with new URL
        setVideoRefreshKey(prev => prev + 1);
        toast.success('Video refreshed successfully!');
      } else {
        toast.error(result.error || 'Failed to refresh video.');
      }
    } catch (err) {
      console.error('Failed to refresh video:', err);
      toast.error('Failed to refresh video. Please try again.');
    } finally {
      setIsRefreshingVideo(false);
    }
  };

  // Handle AI image generation
  const handleGenerateImage = async () => {
    if (!recipe) return;

    setIsGeneratingImage(true);
    try {
      const result = await aiService.generateImage(recipe.id);
      if (result.success) {
        await queryClient.refetchQueries({ queryKey: recipeKeys.detail(recipe.id) });
        toast.success('Image generated successfully!');
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle remove image
  const handleRemoveImage = async () => {
    if (!recipe) return;

    setIsRemovingImage(true);
    try {
      const result = await aiService.removeImage(recipe.id);
      if (result.success) {
        await queryClient.refetchQueries({ queryKey: recipeKeys.detail(recipe.id) });
        toast.success('Image removed.');
      }
    } catch (err) {
      console.error('Failed to remove image:', err);
      toast.error('Failed to remove image. Please try again.');
    } finally {
      setIsRemovingImage(false);
    }
  };

  // Calculate adjusted quantity with optional unit conversion
  const adjustQuantity = (quantity?: number, unit?: string, ingredientName?: string) => {
    if (!quantity) return { display: '', unit: unit || '' };

    let adjustedQty = quantity * servingMultiplier;
    let displayUnit = unit || '';

    // Apply unit conversion if not in 'original' mode
    // Uses ingredient-aware conversion: dry ingredients → grams, wet → ml
    if (unitDisplay !== 'original' && displayUnit && canConvert(displayUnit)) {
      const converted = convertQuantityWithIngredient(adjustedQty, displayUnit, unitDisplay, ingredientName);
      adjustedQty = converted.quantity;
      displayUnit = converted.unit;
    }

    return {
      display: formatQuantity(adjustedQty),
      unit: displayUnit,
    };
  };

  // Toggle ingredient check
  const toggleIngredient = (ingredientKey: string) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(ingredientKey)) {
      newChecked.delete(ingredientKey);
    } else {
      newChecked.add(ingredientKey);
    }
    setCheckedIngredients(newChecked);
  };

  // Toggle step check
  const toggleStep = (stepOrder: number) => {
    const newChecked = new Set(checkedSteps);
    if (newChecked.has(stepOrder)) {
      newChecked.delete(stepOrder);
    } else {
      newChecked.add(stepOrder);
    }
    setCheckedSteps(newChecked);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!recipe) return;

    const confirmed = await confirmDialog({
      title: 'Delete Recipe',
      message: 'Are you sure you want to delete this recipe?',
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await deleteRecipe.mutateAsync(recipe.id);
      navigate('/recipes');
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      toast.error('Failed to delete recipe');
    }
  };

  // Handle nutrition estimation (saves to database)
  const handleEstimateNutrition = async () => {
    if (!recipe || !id) return;

    setIsEstimatingNutrition(true);
    try {
      await aiService.estimateAndSaveNutrition(id);
      // Refetch recipe to get the saved nutrition data
      await queryClient.refetchQueries({ queryKey: recipeKeys.detail(id) });
      setEstimatedNutrition(null); // Clear local state since it's now in the recipe
      toast.success('Nutrition estimated and saved!');
    } catch (err) {
      console.error('Failed to estimate nutrition:', err);
      toast.error('Failed to estimate nutrition. Please try again.');
    } finally {
      setIsEstimatingNutrition(false);
    }
  };

  // Handle fork recipe
  const handleForkRecipe = async (forkNote?: string, visibility?: RecipeVisibility) => {
    if (!recipe || !id) return;

    try {
      const forkedRecipe = await forkRecipe.mutateAsync({
        recipeId: id,
        dto: { forkNote, visibility },
      });
      recipeActions.trackFork(); // Track fork action
      setShowForkModal(false);
      toast.success('Recipe forked successfully!');
      navigate(`/recipes/${forkedRecipe.id}`);
    } catch (err) {
      console.error('Failed to fork recipe:', err);
      toast.error('Failed to fork recipe. Please try again.');
    }
  };

  // Handle visibility change
  const handleVisibilityChange = async (newVisibility: RecipeVisibility) => {
    if (!id || !recipe) return;
    try {
      await updateVisibility.mutateAsync({ recipeId: id, visibility: newVisibility });
      const labels: Record<RecipeVisibility, string> = {
        PRIVATE: 'Recipe is now private',
        FOLLOWERS: 'Recipe is now visible to your followers',
        PUBLIC: 'Recipe is now public',
      };
      toast.success(labels[newVisibility]);
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  // Handle AI step generation
  const handleGenerateSteps = async () => {
    if (!recipe || !id) return;

    setIsGeneratingSteps(true);
    try {
      await aiService.generateSteps(id);
      // Invalidate the recipe query to refetch with updated steps
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(id) });
      toast.success('Detailed steps generated successfully!');
    } catch (err) {
      console.error('Failed to generate steps:', err);
      toast.error('Failed to generate steps. Please try again.');
    } finally {
      setIsGeneratingSteps(false);
    }
  };

  // Handle print with selected sections
  const handlePrint = (enabledSections: Record<string, boolean>, options: { colorMode: 'color' | 'bw'; compactMode: boolean }) => {
    // Find all print sections and mark disabled ones with data-print-hidden
    const hiddenElements: HTMLElement[] = [];

    Object.entries(enabledSections).forEach(([sectionId, enabled]) => {
      if (!enabled) {
        const elements = document.querySelectorAll(`[data-print-section="${sectionId}"]`);
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          // Mark element to be hidden in print
          htmlEl.setAttribute('data-print-hidden', 'true');
          hiddenElements.push(htmlEl);
        });
      }
    });

    // Apply print options to body
    document.body.setAttribute('data-print-color', options.colorMode);
    document.body.setAttribute('data-print-compact', options.compactMode ? 'true' : 'false');

    // Track print action
    recipeActions.trackPrint();

    // Trigger print
    window.print();

    // Remove hidden markers and options after print dialog closes
    setTimeout(() => {
      hiddenElements.forEach((el) => {
        el.removeAttribute('data-print-hidden');
      });
      document.body.removeAttribute('data-print-color');
      document.body.removeAttribute('data-print-compact');
    }, 500);
  };

  // Loading state
  if (isLoading && !USE_DEMO_DATA) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (error && !USE_DEMO_DATA) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-primary-900">Recipe not found</h2>
        <p className="mt-2 text-primary-500">The recipe you're looking for doesn't exist.</p>
        <Link to="/recipes">
          <Button className="mt-4">Back to Recipes</Button>
        </Link>
      </div>
    );
  }

  if (!recipe) return null;

  const baseServings = recipe.servings || 4;
  const adjustedServings = baseServings * servingMultiplier;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header - Action Bar */}
      <div className="print:hidden">
        <OptionAActionBar
          recipeId={recipe.id}
          visibility={recipe.visibility}
          isFavorite={isFavorite}
          hasTranslations={!!(translations?.english || translations?.arabic)}
          isTranslating={translateRecipe.isPending}
          isUpdatingVisibility={updateVisibility.isPending}
          isOwner={isOwner}
          prevId={prevId}
          nextId={nextId}
          onFavoriteToggle={() => {
            if (isFavorite) recipeActions.trackUnsave();
            else recipeActions.trackSave();
            setIsFavorite(!isFavorite);
          }}
          onShare={() => { recipeActions.trackShare(); setShowShareModal(true); }}
          onPrint={() => setShowPrintModal(true)}
          onAddToCollection={() => setShowCollectionModal(true)}
          onVisibilityChange={handleVisibilityChange}
          onFork={() => setShowForkModal(true)}
          onCook={() => navigate(`/recipes/${recipe.id}/cook`)}
          onMadeIt={() => setShowMadeItModal(true)}
          onTranslate={handleTranslate}
          onDelete={handleDelete}
        />
      </div>

      {/* Hero Section */}
      <div className="grid md:grid-cols-2 gap-8" data-print-section="header">
        {/* Image/Video */}
        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-primary-100 relative shadow-lg">
          {/* YouTube Embed for YouTube-sourced recipes */}
          {recipe.source === 'YOUTUBE' && recipe.sourceUrl && extractYouTubeVideoId(recipe.sourceUrl) ? (
            <iframe
              src={`https://www.youtube.com/embed/${extractYouTubeVideoId(recipe.sourceUrl)}`}
              title={recipe.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : recipe.videoUrl && !videoError ? (
            <video
              key={`video-${recipe.id}-${videoRefreshKey}`}
              src={`${getImageUrl(recipe.videoUrl)}${videoRefreshKey > 0 ? `?v=${videoRefreshKey}` : ''}`}
              poster={getImageUrl(recipe.imageUrl)}
              controls
              className="w-full h-full object-contain bg-black"
              preload="metadata"
              playsInline
              onError={() => setVideoError(true)}
            >
              Your browser does not support the video tag.
            </video>
          ) : videoError && recipe.videoUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100">
              {recipe.imageUrl ? (
                <img
                  src={getImageUrl(recipe.imageUrl)}
                  alt={recipe.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-50 print:opacity-100"
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-center px-4 print:hidden">
                <Play className="w-12 h-12 mb-2 opacity-50" />
                <p className="font-medium">Video unavailable</p>
                <p className="text-sm opacity-75 mt-1 max-w-xs">Click "Refresh Video" to download a fresh copy from Instagram.</p>
                <div className="flex items-center gap-3 mt-4">
                  {recipe.sourceUrl && (
                    <button
                      onClick={handleDownloadVideo}
                      disabled={isRefreshingVideo}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isRefreshingVideo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      {isRefreshingVideo ? 'Refreshing...' : 'Refresh Video'}
                    </button>
                  )}
                  {recipe.sourceUrl && (
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Instagram
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : recipe.imageUrl ? (
            <img
              src={getImageUrl(recipe.imageUrl)}
              alt={recipe.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
              <ChefHat className="w-16 h-16 text-neutral-300" />
              <div className="text-center">
                <p className="text-neutral-500 text-sm mb-3">No image available</p>
                <Button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Image with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {recipe.videoUrl && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-black/70 text-white border-0">
                <Play className="w-3 h-3 mr-1" />
                Video
              </Badge>
            </div>
          )}
          {/* Download button for external images - hidden in print */}
          {isExternalImage && !recipe.videoUrl && (
            <button
              onClick={handleDownloadImage}
              disabled={downloadImage.isPending}
              className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-black/70 hover:bg-black/80 text-white text-sm rounded-lg transition-colors disabled:opacity-50 print:hidden"
              title="Reload image"
            >
              {downloadImage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {downloadImage.isPending ? 'Reloading...' : 'Reload Image'}
            </button>
          )}
          {/* AI Image buttons - hidden in print */}
          {recipe.imageUrl && !recipe.videoUrl && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2 print:hidden">
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || isRemovingImage}
                className="flex items-center gap-1.5 px-3 py-2 bg-black/70 hover:bg-black/80 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate image with AI"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                {isGeneratingImage ? 'Generating...' : 'Regenerate'}
              </button>
              <button
                onClick={handleRemoveImage}
                disabled={isGeneratingImage || isRemovingImage}
                className="flex items-center gap-1.5 px-3 py-2 bg-black/70 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                title="Remove image"
              >
                {isRemovingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-900">{recipe.title}</h1>
              <Badge
                className={cn(
                  'flex items-center gap-1',
                  recipe.visibility === 'PUBLIC'
                    ? 'bg-mint-100 text-mint-700'
                    : recipe.visibility === 'FOLLOWERS'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-primary-100 text-primary-600'
                )}
              >
                {recipe.visibility === 'PUBLIC' ? (
                  <Globe className="w-3 h-3" />
                ) : recipe.visibility === 'FOLLOWERS' ? (
                  <Users className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                {recipe.visibility === 'PUBLIC' ? 'Public' : recipe.visibility === 'FOLLOWERS' ? 'Followers' : 'Private'}
              </Badge>
            </div>
            {recipe.sourceAuthor && (
              <p className="mt-2 text-primary-500">
                By{' '}
                <Link
                  to={`/recipes?author=${encodeURIComponent(recipe.sourceAuthor)}`}
                  className="text-coral-600 hover:text-coral-700 hover:underline font-medium"
                >
                  {recipe.sourceAuthor}
                </Link>
              </p>
            )}
            {/* Fork Badge - shown if this is a forked recipe */}
            {recipe.parentRecipe && (
              <div data-print-section="forkInfo">
                <ForkBadge
                  parentRecipe={recipe.parentRecipe}
                  sourceAuthor={recipe.sourceAuthor}
                  forkedBy={recipe.user}
                  forkNote={recipe.forkNote}
                  className="mt-2"
                />
              </div>
            )}
          </div>

          {recipe.description && (
            <p className="text-lg text-primary-600 leading-relaxed">{recipe.description}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2" data-print-section="tags">
            {recipe.difficulty && (
              <Badge className={cn(difficultyColors[recipe.difficulty], 'uppercase text-xs font-bold tracking-wider')}>
                {recipe.difficulty}
              </Badge>
            )}
            {recipe.category && (
              <Badge className="bg-coral-50 text-coral-700 uppercase text-xs font-bold tracking-wider">
                {recipe.category.replace('_', ' ')}
              </Badge>
            )}
            {recipe.cuisine && (
              <Badge className="bg-primary-50 text-primary-600 uppercase text-xs font-bold tracking-wider">{recipe.cuisine}</Badge>
            )}
          </div>

          {/* Quick Stats - for print only since we have floating card */}
          <div className="hidden print:grid grid-cols-3 gap-4 py-4 border-y border-primary-100" data-print-section="quickStats">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary-500 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Total Time</span>
              </div>
              <p className="font-semibold text-primary-900">
                {recipe.totalTimeMinutes || (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary-500 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Servings</span>
              </div>
              <p className="font-semibold text-primary-900">{adjustedServings}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary-500 mb-1">
                <ChefHat className="w-4 h-4" />
                <span className="text-xs">Difficulty</span>
              </div>
              <p className="font-semibold text-primary-900">
                {recipe.difficulty || 'Medium'}
              </p>
            </div>
          </div>

          {/* Source Badge & Link */}
          <div data-print-section="source">
            {recipe.source && recipe.source !== 'TEXT' && (
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  variant="secondary"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1"
                >
                  {recipe.source === 'INSTAGRAM_URL' || recipe.source === 'INSTAGRAM_SHARE' ? (
                    <Instagram className="w-3.5 h-3.5" />
                  ) : recipe.source === 'YOUTUBE' ? (
                    <Youtube className="w-3.5 h-3.5" />
                  ) : recipe.source === 'FACEBOOK_URL' || recipe.source === 'FACEBOOK_SHARE' ? (
                    <Facebook className="w-3.5 h-3.5" />
                  ) : recipe.source === 'WEB_URL' || recipe.source === 'URL' ? (
                    <Link2 className="w-3.5 h-3.5" />
                  ) : recipe.source === 'IMAGE' ? (
                    <Image className="w-3.5 h-3.5" />
                  ) : recipe.source === 'PDF' ? (
                    <FileType className="w-3.5 h-3.5" />
                  ) : recipe.source === 'GENERATED' ? (
                    <Wand2 className="w-3.5 h-3.5" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span className="text-xs font-medium">
                    {recipe.source === 'INSTAGRAM_URL' || recipe.source === 'INSTAGRAM_SHARE'
                      ? 'Instagram'
                      : recipe.source === 'YOUTUBE'
                        ? 'YouTube'
                        : recipe.source === 'FACEBOOK_URL' || recipe.source === 'FACEBOOK_SHARE'
                          ? 'Facebook'
                          : recipe.source === 'WEB_URL' || recipe.source === 'URL'
                            ? 'Website'
                            : recipe.source === 'IMAGE'
                              ? 'Image'
                              : recipe.source === 'PDF'
                                ? 'PDF'
                                : recipe.source === 'GENERATED'
                                  ? 'AI Generated'
                                  : 'Other'}
                  </span>
                </Badge>
                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    View original source
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
            {/* Source Link only (for TEXT source with URL) */}
            {recipe.source === 'TEXT' && recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                View original source
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Quick Stats Card */}
          <div className="bg-primary-50 p-4 rounded-2xl flex justify-between items-center print:hidden">
            <div className="text-center flex-1 border-r border-primary-100">
              <div className="flex items-center justify-center gap-1 text-primary-500 mb-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <p className="font-bold text-primary-900">
                {recipe.totalTimeMinutes || (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min
              </p>
              <p className="text-[10px] uppercase font-bold text-primary-400">Total</p>
            </div>
            <div className="text-center flex-1 border-r border-primary-100">
              <div className="flex items-center justify-center gap-1 text-primary-500 mb-0.5">
                <Users className="w-4 h-4" />
              </div>
              <p className="font-bold text-primary-900">{adjustedServings}</p>
              <p className="text-[10px] uppercase font-bold text-primary-400">Servings</p>
            </div>
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1 text-primary-500 mb-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <p className="font-bold text-primary-900">
                {recipe.nutrition?.caloriesPerServing || '—'}
              </p>
              <p className="text-[10px] uppercase font-bold text-primary-400">Cals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Translations Panel */}
      {(translations?.english || translations?.arabic) && (
        <Card className="p-6" data-print-section="translations">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-neutral-900 flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Translations
              <Badge variant="success" className="text-xs">Available</Badge>
            </h3>
            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTranslate}
                disabled={translateRecipe.isPending}
              >
                {translateRecipe.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-translate
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranslations(!showTranslations)}
              >
                {showTranslations ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </div>

          {showTranslations && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* English Translation */}
              {translations?.english && (
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50/50">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <span className="px-2 py-1 bg-blue-100 rounded">EN</span>
                    English
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{translations.english.title}</h4>
                    {translations.english.description && (
                      <p className="text-sm text-neutral-600 mt-1">{translations.english.description}</p>
                    )}
                  </div>
                  {/* English Ingredients */}
                  {translations.english.components?.map((comp, compIdx) => (
                    <div key={compIdx} className="space-y-2">
                      <h5 className="text-sm font-medium text-neutral-700">{comp.name} - Ingredients:</h5>
                      <ul className="text-sm text-neutral-600 space-y-1 pl-4">
                        {comp.ingredients.map((ing, ingIdx) => (
                          <li key={ingIdx}>
                            {ing.quantity && <span className="font-medium">{ing.quantity} </span>}
                            {ing.unit && <span>{ing.unit} </span>}
                            {ing.name}
                            {ing.notes && <span className="text-neutral-400"> ({ing.notes})</span>}
                          </li>
                        ))}
                      </ul>
                      <h5 className="text-sm font-medium text-neutral-700 mt-3">{comp.name} - Steps:</h5>
                      <ol className="text-sm text-neutral-600 space-y-2 pl-4">
                        {comp.steps.map((step, stepIdx) => (
                          <li key={stepIdx}>
                            <span className="font-medium">{step.order}.</span> {step.instruction}
                            {step.tips && <p className="text-xs text-amber-600 mt-1">Tip: {step.tips}</p>}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
              {/* Arabic Translation */}
              {translations?.arabic && (
                <div className="space-y-4 border rounded-lg p-4 bg-green-50/50" dir="rtl">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                    <span className="px-2 py-1 bg-green-100 rounded">AR</span>
                    العربية
                  </div>
                  <div className="text-right">
                    <h4 className="font-semibold text-neutral-900">{translations.arabic.title}</h4>
                    {translations.arabic.description && (
                      <p className="text-sm text-neutral-600 mt-1">{translations.arabic.description}</p>
                    )}
                  </div>
                  {/* Arabic Ingredients */}
                  {translations.arabic.components?.map((comp, compIdx) => (
                    <div key={compIdx} className="space-y-2 text-right">
                      <h5 className="text-sm font-medium text-neutral-700">{comp.name} - المكونات:</h5>
                      <ul className="text-sm text-neutral-600 space-y-1 pr-4">
                        {comp.ingredients.map((ing, ingIdx) => (
                          <li key={ingIdx}>
                            {ing.quantity && <span className="font-medium">{ing.quantity} </span>}
                            {ing.unit && <span>{ing.unit} </span>}
                            {ing.name}
                            {ing.notes && <span className="text-neutral-400"> ({ing.notes})</span>}
                          </li>
                        ))}
                      </ul>
                      <h5 className="text-sm font-medium text-neutral-700 mt-3">{comp.name} - الخطوات:</h5>
                      <ol className="text-sm text-neutral-600 space-y-2 pr-4">
                        {comp.steps.map((step, stepIdx) => (
                          <li key={stepIdx}>
                            <span className="font-medium">{step.order}.</span> {step.instruction}
                            {step.tips && <p className="text-xs text-amber-600 mt-1">نصيحة: {step.tips}</p>}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Personal Allergen Warning - hidden in print */}
      <div data-print-section="allergenWarning">
        <PersonalAllergenWarning recipeId={recipe.id} />
      </div>

      {/* Circle Compatibility Check */}
      <div data-print-section="circleCompatibility">
        <CircleCompatibilityCard recipeId={recipe.id} />
      </div>

      {/* Tabs - hidden in print */}
      <div className="border-b border-primary-100 print:hidden">
        <div className="flex gap-8 overflow-x-auto">
          {[
            { id: 'ingredients' as const, icon: Utensils, label: 'Ingredients' },
            { id: 'steps' as const, icon: ChefHat, label: 'Instructions' },
            { id: 'nutrition' as const, icon: Flame, label: 'Nutrition' },
            { id: 'notes' as const, icon: FilePen, label: 'Notes' },
            { id: 'forks' as const, icon: GitFork, label: `Forks (${recipe.forkCount || 0})` },
            { id: 'comments' as const, icon: MessageSquare, label: 'Comments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-coral-500 text-coral-600'
                  : 'border-transparent text-primary-500 hover:text-primary-800 hover:border-primary-200'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px] print:min-h-0">
        {/* Ingredients Tab */}
        <div className={`print-section ${activeTab === 'ingredients' ? '' : 'hidden'}`} data-print-show data-print-section="ingredients">
          <h2 className="hidden print:block text-xl font-bold mb-4 border-b pb-2">Ingredients</h2>

          {/* Serving Adjuster & Unit Toggle - hidden in print */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-primary-50 rounded-xl print:hidden">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-primary-700">Servings:</span>
              <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-sm">
                <button
                  onClick={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
                  className="w-8 h-8 rounded-lg border border-primary-100 bg-white flex items-center justify-center hover:bg-primary-50 transition-colors"
                >
                  <Minus className="w-4 h-4 text-primary-600" />
                </button>
                <span className="w-12 text-center font-bold text-lg text-primary-900">{adjustedServings}</span>
                <button
                  onClick={() => setServingMultiplier(servingMultiplier + 0.5)}
                  className="w-8 h-8 rounded-lg border border-primary-100 bg-white flex items-center justify-center hover:bg-primary-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary-700">Units:</span>
              <UnitToggle
                value={unitDisplay}
                onChange={(system) => {
                  setUnitDisplay(system);
                  setRecipePageOverride(system);
                }}
                size="sm"
              />
            </div>
          </div>

          <div className="space-y-6">
            {recipe.components.map((component, compIdx) => (
              <Card key={compIdx} className="p-6 bg-white rounded-2xl shadow-sm border border-primary-100">
                {recipe.components.length > 1 && (
                  <h3 className="font-display font-bold text-xl text-primary-900 mb-6">
                    {component.name}
                  </h3>
                )}
                <ul className="space-y-1">
                  {component.ingredients.map((ingredient, ingIdx) => {
                    const key = `${compIdx}-${ingIdx}`;
                    const isChecked = checkedIngredients.has(key);

                    return (
                      <li
                        key={ingIdx}
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors group',
                          isChecked ? 'bg-primary-50' : 'hover:bg-cream-50'
                        )}
                        onClick={() => toggleIngredient(key)}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                            isChecked
                              ? 'bg-coral-500 border-coral-500'
                              : 'border-primary-200 group-hover:border-coral-400'
                          )}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn('flex-1 text-sm font-medium', isChecked && 'text-primary-400 line-through')}>
                          {(() => {
                            const { display, unit } = adjustQuantity(ingredient.quantity, ingredient.unit, ingredient.name);
                            return display ? (
                              <span className="font-bold text-primary-900">
                                {display}
                                {unit && ` ${unit}`}
                              </span>
                            ) : null;
                          })()}{' '}
                          {ingredient.name}
                          {ingredient.notes && (
                            <span className="text-primary-400"> ({ingredient.notes})</span>
                          )}
                          {ingredient.optional && (
                            <Badge className="ml-2 text-xs bg-primary-100 text-primary-500">optional</Badge>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Steps Tab */}
        <div className={`print-section ${activeTab === 'steps' ? '' : 'hidden'}`} data-print-show data-print-section="steps">
          <h2 className="hidden print:block text-xl font-bold mb-4 border-b pb-2 mt-8">Instructions</h2>
          <div className="space-y-6">
            {recipe.components.map((component, compIdx) => (
              <Card key={compIdx} className="p-8 bg-white rounded-2xl shadow-sm border border-primary-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display font-bold text-2xl text-primary-900">
                    {recipe.components.length > 1 ? component.name : 'Instructions'}
                  </h2>
                  {/* Generate Steps Button - hidden in print */}
                  <div className="flex items-center gap-3 print:hidden">
                    {recipe.components.some((c: any) => c.aiGeneratedSteps) && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                        <Sparkles className="w-3 h-3" />
                        AI Enhanced
                      </span>
                    )}
                    <button
                      onClick={handleGenerateSteps}
                      disabled={isGeneratingSteps}
                      className="text-sm font-bold text-coral-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      {isGeneratingSteps ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          AI: Enhance Steps
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  {component.steps.map((step, stepIdx) => {
                    const isChecked = checkedSteps.has(step.order);

                    return (
                      <div
                        key={stepIdx}
                        className="flex gap-6 group cursor-pointer"
                        onClick={() => toggleStep(step.order)}
                      >
                        <div
                          className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold border transition-colors',
                            isChecked
                              ? 'bg-coral-500 border-coral-500 text-white'
                              : 'bg-primary-100 text-primary-700 border-primary-200 group-hover:bg-primary-900 group-hover:text-white group-hover:border-primary-900'
                          )}
                        >
                          {isChecked ? <Check className="w-5 h-5" /> : step.order}
                        </div>
                        <div className="pt-2 flex-1">
                          <p className={cn(
                            'text-lg leading-relaxed transition-colors',
                            isChecked
                              ? 'text-primary-400 line-through'
                              : 'text-primary-800 group-hover:text-primary-900'
                          )}>
                            {step.instruction}
                          </p>
                          {(step.duration || step.temperature) && (
                            <div className="flex items-center gap-4 mt-2">
                              {step.duration && (
                                <span className="flex items-center gap-1 text-sm text-primary-500">
                                  <Timer className="w-4 h-4" />
                                  {step.duration} min
                                </span>
                              )}
                              {step.temperature && (
                                <span className="text-sm text-primary-500">
                                  {step.temperature}
                                </span>
                              )}
                            </div>
                          )}
                          {step.tips && (
                            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-800 text-sm">
                              <ChefHat className="w-5 h-5 flex-shrink-0" />
                              <p><span className="font-bold">Pro Tip:</span> {step.tips}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}

            {/* Made This CTA Card */}
            <div className="grid md:grid-cols-2 gap-6 print:hidden">
              <Card className="p-6 bg-white rounded-2xl shadow-sm border border-primary-100 h-full">
                <h3 className="font-bold text-lg text-primary-900 mb-4">Chef's Notes</h3>
                <p className="text-primary-600 leading-relaxed">
                  {recipe.notes?.personalNotes || 'Add your own notes and tips for next time you make this recipe.'}
                </p>
              </Card>
              <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-6 shadow-lg text-white h-full relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2">Made this?</h3>
                  <p className="text-white/80 text-sm mb-4">Share a photo and let us know how it turned out!</p>
                  <button
                    onClick={() => setShowMadeItModal(true)}
                    className="w-full bg-white text-primary-900 py-3 rounded-xl font-bold text-sm hover:bg-primary-50 transition-colors"
                  >
                    Upload Photo
                  </button>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Nutrition Tab */}
        <div className={`print-section ${activeTab === 'nutrition' ? '' : 'hidden'}`} data-print-show data-print-section="nutrition">
          {recipe.nutrition && (
            <h2 className="hidden print:block text-xl font-bold mb-4 border-b pb-2 mt-8">Nutrition</h2>
          )}
          <NutritionCard
            nutrition={recipe.nutrition}
            estimatedNutrition={estimatedNutrition}
            onEstimate={handleEstimateNutrition}
            isEstimating={isEstimatingNutrition}
            servings={recipe.servings}
          />
        </div>

        {/* Notes Tab */}
        <div className={`print-section ${activeTab === 'notes' ? '' : 'hidden'}`} data-print-show data-print-section="notes">
          {/* Only show Notes header in print if there are actual notes */}
          {(recipe.notes?.personalNotes || recipe.notes?.sharedNotes) && (
            <h2 className="hidden print:block text-xl font-bold mb-4 border-b pb-2 mt-8">Notes</h2>
          )}
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Personal Notes Card with yellow theme */}
            <div className={cn(
              'bg-yellow-50 rounded-2xl p-8 border border-yellow-100 shadow-sm relative overflow-hidden',
              !recipe.notes?.personalNotes && 'print:hidden'
            )}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FilePen className="w-32 h-32 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2 relative z-10">
                <FilePen className="w-6 h-6" /> Personal Chef Notes
              </h3>
              {recipe.notes?.personalNotes ? (
                <p className="text-yellow-900/80 leading-relaxed relative z-10 whitespace-pre-wrap">
                  {recipe.notes.personalNotes}
                </p>
              ) : (
                <textarea
                  className="w-full bg-white/50 border border-yellow-200 rounded-xl p-4 text-yellow-900 placeholder:text-yellow-900/40 focus:ring-2 focus:ring-yellow-400 focus:border-transparent min-h-[150px] relative z-10"
                  placeholder="Add your own notes, tweaks, and reminders for next time..."
                />
              )}
              <div className="flex justify-end mt-4 relative z-10 print:hidden">
                <Button className="bg-yellow-600 text-white hover:bg-yellow-700">
                  <Edit className="w-4 h-4 mr-2" />
                  {recipe.notes?.personalNotes ? 'Edit Notes' : 'Save Notes'}
                </Button>
              </div>
            </div>

            {recipe.notes?.sharedNotes && (
              <Card className="p-6 bg-white rounded-2xl shadow-sm border border-primary-100">
                <h3 className="font-bold text-primary-900 mb-3">Shared Notes</h3>
                <p className="text-primary-600 leading-relaxed">{recipe.notes.sharedNotes}</p>
              </Card>
            )}

            {/* Tags - hidden in print */}
            {recipe.tags && recipe.tags.length > 0 && (
              <Card className="p-6 bg-white rounded-2xl shadow-sm border border-primary-100 print:hidden">
                <h3 className="font-bold text-primary-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, idx) => (
                    <Link
                      key={idx}
                      to={`/recipes?search=${encodeURIComponent(tag)}`}
                      className="hover:scale-105 transition-transform"
                    >
                      <Badge className="cursor-pointer bg-primary-50 text-primary-600 hover:bg-primary-100">
                        #{tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Forks Tab */}
        <div className={`${activeTab === 'forks' ? '' : 'hidden'}`} data-print-section="forks">
          <div className="space-y-6">
            {/* Fork Stats */}
            <Card className="p-6 bg-white rounded-2xl shadow-sm border border-primary-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center">
                    <GitFork className="w-6 h-6 text-coral-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary-900">{recipe.forkCount}</p>
                    <p className="text-sm text-primary-500">
                      {recipe.forkCount === 1 ? 'fork' : 'forks'} of this recipe
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Compare with Original button (if this is a fork) */}
                  {recipe.parentRecipeId && (
                    <Button
                      variant="outline"
                      onClick={() => setShowDiffModal(true)}
                    >
                      Compare with Original
                    </Button>
                  )}
                  {/* Fork this recipe button */}
                  <Button
                    onClick={() => setShowForkModal(true)}
                    className="bg-primary-500 hover:bg-primary-600"
                  >
                    <GitFork className="w-4 h-4 mr-2" />
                    Fork this Recipe
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recipe Genealogy Tree */}
            <RecipeGenealogyTree recipeId={recipe.id} />

            {/* Forks List */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">
                Forks of this Recipe
              </h3>
              <ForksList recipeId={recipe.id} />
            </div>
          </div>
        </div>

        {/* Comments Tab */}
        <div className={`${activeTab === 'comments' ? '' : 'hidden'}`} data-print-section="comments">
          <Card className="p-6">
            <CommentSection recipeId={recipe.id} />
          </Card>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {USE_DEMO_DATA && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
          Demo Mode - Viewing sample recipe
        </div>
      )}

      {/* Share Modal */}
      {recipe && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          type="recipe"
          itemId={recipe.id}
          itemName={recipe.title}
          onCreateCard={() => setShowShareCardModal(true)}
        />
      )}

      {/* Add to Collection Modal */}
      {recipe && (
        <AddToCollectionModal
          isOpen={showCollectionModal}
          onClose={() => setShowCollectionModal(false)}
          recipeId={recipe.id}
          recipeTitle={recipe.title}
        />
      )}

      {/* Fork Modal */}
      {recipe && (
        <ForkModal
          recipe={recipe}
          isOpen={showForkModal}
          onClose={() => setShowForkModal(false)}
          onFork={handleForkRecipe}
          isLoading={forkRecipe.isPending}
        />
      )}

      {/* Recipe Diff Modal */}
      <RecipeDiffModal
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        diff={comparisonDiff || null}
        originalTitle={recipe?.parentRecipe?.title || 'Original'}
        modifiedTitle={recipe?.title || 'Modified'}
        isLoading={isLoadingDiff}
      />

      {/* AI Chef Assistant - Floating Chat */}
      {recipe && (
        <ChatAssistant
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          className="print:hidden"
        />
      )}

      {/* Made It Review Modal */}
      {recipe && (
        <MadeItModal
          isOpen={showMadeItModal}
          onClose={() => setShowMadeItModal(false)}
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          onSuccess={() => {
            recipeActions.trackCookComplete();
          }}
        />
      )}

      {/* Print Settings Modal */}
      {recipe && (
        <PrintSettingsModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          onPrint={handlePrint}
          recipeTitle={recipe.title}
          availableSections={[
            'header',
            'quickStats',
            'tags',
            'ingredients',
            'steps',
            'nutrition',
            'notes',
            'forks',
            'comments',
            'allergenWarning',
            'circleCompatibility',
            ...((translations?.english || translations?.arabic) ? ['translations'] : []),
            ...(recipe.sourceUrl ? ['source'] : []),
            ...(recipe.parentRecipeId ? ['forkInfo'] : []),
          ]}
        />
      )}

      {/* Share Card Modal */}
      {recipe && (
        <ShareCardModal
          isOpen={showShareCardModal}
          onClose={() => setShowShareCardModal(false)}
          recipe={recipe}
        />
      )}
    </div>
  );
}
