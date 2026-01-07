import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Check,
  Clock,
  ChefHat,
  Loader2,
  Settings2,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Button, Card, useToast } from '../../components/ui';
import { MadeItModal } from '../../components/recipes';
import { StepTimer } from '../../components/cooking/StepTimer';
import { SaltSenseButtons, stepMentionsSeasoning } from '../../components/cooking/SaltSenseButtons';
import { AllergenWarningBanner } from '../../components/cooking/AllergenWarningBanner';
import { useRecipe, useRecipeActions } from '../../hooks';
import { useCircles } from '../../hooks/useDinnerCircles';
import { useRecipeCompatibility } from '../../hooks/useRecipeCompatibility';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { cn } from '../../lib/utils';

interface Step {
  order: number;
  instruction: string;
  duration?: number;
  tips?: string;
}

interface Ingredient {
  quantity?: number;
  unit?: string;
  name: string;
  notes?: string;
  optional?: boolean;
}

export function CookModePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Circle selection for allergen warnings
  const circleIdFromUrl = searchParams.get('circleId');
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(circleIdFromUrl);

  // Fetch recipe
  const { data: recipe, isLoading, error } = useRecipe(id || '');

  // Fetch circles and compatibility
  const { data: circles } = useCircles();
  const { data: compatibility } = useRecipeCompatibility(id, selectedCircleId || undefined);
  const selectedCircle = circles?.find((c) => c.id === selectedCircleId);

  // Track cooking actions
  const recipeActions = useRecipeActions(id || '');

  // Speech synthesis
  const {
    speak,
    cancel: cancelSpeech,
    pause: pauseSpeech,
    resume: resumeSpeech,
    isSpeaking,
    isPaused,
    isSupported: speechSupported,
    rate,
    setRate,
  } = useSpeechSynthesis();

  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showMadeItModal, setShowMadeItModal] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Flatten all steps from all components
  const allSteps = useMemo(() => {
    if (!recipe?.components) return [];
    return recipe.components.flatMap((comp) =>
      comp.steps.map((step) => ({
        ...step,
        componentName: comp.name,
      }))
    );
  }, [recipe]);

  // All ingredients
  const allIngredients = useMemo(() => {
    if (!recipe?.components) return [];
    return recipe.components.flatMap((comp) =>
      comp.ingredients.map((ing, idx) => ({
        ...ing,
        key: `${comp.name}-${idx}`,
        componentName: comp.name,
      }))
    );
  }, [recipe]);

  // Get set of conflicting ingredient names for highlighting
  const conflictingIngredientNames = useMemo(() => {
    if (!compatibility || compatibility.isCompatible) return new Set<string>();
    return new Set(
      compatibility.allConflictingIngredients.map((name) => name.toLowerCase())
    );
  }, [compatibility]);

  // Helper to check if an ingredient conflicts
  const getIngredientConflictInfo = (ingredientName: string) => {
    if (!compatibility || compatibility.isCompatible) return null;
    const lowerName = ingredientName.toLowerCase();

    // Find all conflicts that match this ingredient
    const conflicts: Array<{ member: string; type: 'allergen' | 'restriction'; allergens: string[] }> = [];

    compatibility.memberConflicts.forEach((member) => {
      member.allergenConflicts.forEach((conflict) => {
        if (conflict.ingredientName.toLowerCase() === lowerName) {
          conflicts.push({
            member: member.memberName,
            type: 'allergen',
            allergens: conflict.allergens,
          });
        }
      });
      member.restrictionConflicts.forEach((conflict) => {
        if (conflict.ingredientName.toLowerCase() === lowerName) {
          conflicts.push({
            member: member.memberName,
            type: 'restriction',
            allergens: conflict.allergens,
          });
        }
      });
    });

    return conflicts.length > 0 ? conflicts : null;
  };

  const currentStep = allSteps[currentStepIndex];
  const totalSteps = allSteps.length;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  // Track cook start on mount
  useEffect(() => {
    if (id) {
      recipeActions.trackCookStart();
    }
  }, [id]);

  // Speak current step when it changes
  useEffect(() => {
    if (autoSpeak && currentStep && speechSupported) {
      const text = currentStep.instruction;
      speak(text);
    }
  }, [currentStepIndex, autoSpeak, speechSupported]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === 'Escape') {
        handleExit();
      } else if (e.key === 'r' || e.key === 'R') {
        if (currentStep) speak(currentStep.instruction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, totalSteps, currentStep]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      // Mark current step as complete
      setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // All steps complete
      setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
      recipeActions.trackCookComplete();
      setShowMadeItModal(true);
    }
  }, [currentStepIndex, totalSteps, recipeActions]);

  const handlePrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleExit = () => {
    cancelSpeech();
    navigate(`/recipes/${id}`);
  };

  const handleReadStep = () => {
    if (currentStep) {
      speak(currentStep.instruction);
    }
  };

  const toggleIngredient = (key: string) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
    }
    setCheckedIngredients(newChecked);
  };

  // Detect seasoning dimension for current step
  const seasoningDimension = currentStep
    ? stepMentionsSeasoning(currentStep.instruction)
    : null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-cream-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="fixed inset-0 bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Recipe not found</p>
          <Button onClick={() => navigate('/recipes')}>Back to Recipes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-cream-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-neutral-800 line-clamp-1">{recipe.title}</h1>
            <p className="text-sm text-neutral-500">
              Step {currentStepIndex + 1} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Voice controls */}
        <div className="flex items-center gap-2">
          {speechSupported && (
            <>
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  autoSpeak ? 'bg-primary-100 text-primary-600' : 'hover:bg-neutral-100'
                )}
                title={autoSpeak ? 'Voice on' : 'Voice off'}
              >
                {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {isSpeaking && (
                <button
                  onClick={isPaused ? resumeSpeech : pauseSpeech}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-200">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Allergen Warning Banner */}
      {compatibility && !compatibility.isCompatible && selectedCircle && (
        <AllergenWarningBanner
          compatibility={compatibility}
          circleName={selectedCircle.name}
          circleEmoji={selectedCircle.emoji}
        />
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600">Voice Speed:</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm font-medium">{rate.toFixed(1)}x</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Step display */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Component name badge */}
            {currentStep?.componentName && currentStep.componentName !== 'Main' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                <ChefHat className="w-4 h-4" />
                {currentStep.componentName}
              </div>
            )}

            {/* Step instruction - large text for kitchen visibility */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200">
              <p className="text-2xl md:text-3xl leading-relaxed text-neutral-800">
                {currentStep?.instruction}
              </p>

              {/* Tips */}
              {currentStep?.tips && (
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-amber-800">
                    <span className="font-medium">Tip:</span> {currentStep.tips}
                  </p>
                </div>
              )}

              {/* Read again button */}
              {speechSupported && (
                <button
                  onClick={handleReadStep}
                  className="mt-6 flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm">Read again</span>
                </button>
              )}
            </div>

            {/* Timer if step has duration */}
            {currentStep?.duration && currentStep.duration > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3 text-neutral-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Timer</span>
                </div>
                <StepTimer duration={currentStep.duration} />
              </Card>
            )}

            {/* Salt Sense feedback */}
            {seasoningDimension && id && (
              <SaltSenseButtons
                recipeId={id}
                stepIndex={currentStepIndex}
                dimension={seasoningDimension}
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>

              {currentStepIndex < totalSteps - 1 ? (
                <Button onClick={handleNextStep} size="lg" className="gap-2">
                  Next Step
                  <ChevronRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button onClick={handleNextStep} size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                  <Check className="w-5 h-5" />
                  I'm Done!
                </Button>
              )}
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-2 py-4">
              {allSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-all',
                    idx === currentStepIndex
                      ? 'bg-primary-500 scale-125'
                      : completedSteps.has(idx)
                      ? 'bg-green-500'
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Ingredients sidebar - hidden on small screens */}
        <aside className="hidden lg:block w-80 bg-white border-l border-neutral-200 overflow-y-auto">
          {/* Circle Selector for Allergen Check */}
          {circles && circles.length > 0 && (
            <div className="p-4 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-medium text-neutral-700">Cooking for</span>
              </div>
              <select
                value={selectedCircleId || ''}
                onChange={(e) => setSelectedCircleId(e.target.value || null)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Just me</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.emoji || '👥'} {circle.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-4">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📝</span>
              Ingredients
            </h2>

            <div className="space-y-2">
              {allIngredients.map((ing) => {
                const conflictInfo = getIngredientConflictInfo(ing.name);
                const hasAllergenConflict = conflictInfo?.some((c) => c.type === 'allergen');
                const hasRestrictionConflict = conflictInfo?.some((c) => c.type === 'restriction');

                return (
                  <div key={ing.key} className="relative group">
                    <label
                      className={cn(
                        'flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                        checkedIngredients.has(ing.key)
                          ? 'bg-green-50 text-green-700'
                          : hasAllergenConflict
                          ? 'bg-red-50 border-2 border-red-300 hover:bg-red-100'
                          : hasRestrictionConflict
                          ? 'bg-amber-50 border-2 border-amber-300 hover:bg-amber-100'
                          : 'hover:bg-neutral-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checkedIngredients.has(ing.key)}
                        onChange={() => toggleIngredient(ing.key)}
                        className={cn(
                          'mt-1 rounded',
                          hasAllergenConflict
                            ? 'border-red-400 text-red-600 focus:ring-red-500'
                            : hasRestrictionConflict
                            ? 'border-amber-400 text-amber-600 focus:ring-amber-500'
                            : 'border-neutral-300 text-green-600 focus:ring-green-500'
                        )}
                      />
                      <div className="flex-1">
                        <span className={cn(checkedIngredients.has(ing.key) && 'line-through')}>
                          {ing.quantity && `${ing.quantity} `}
                          {ing.unit && `${ing.unit} `}
                          <span className="font-medium">{ing.name}</span>
                          {ing.notes && <span className="text-neutral-500"> ({ing.notes})</span>}
                          {ing.optional && <span className="text-neutral-400 text-sm"> (optional)</span>}
                        </span>

                        {/* Allergen warning icon */}
                        {conflictInfo && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle
                              className={cn(
                                'w-3 h-3',
                                hasAllergenConflict ? 'text-red-500' : 'text-amber-500'
                              )}
                            />
                            <span
                              className={cn(
                                'text-xs',
                                hasAllergenConflict ? 'text-red-600' : 'text-amber-600'
                              )}
                            >
                              Affects {[...new Set(conflictInfo.map((c) => c.member))].join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </label>

                    {/* Tooltip on hover */}
                    {conflictInfo && (
                      <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-10">
                        <div
                          className={cn(
                            'p-2 rounded-lg shadow-lg text-xs',
                            hasAllergenConflict ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                          )}
                        >
                          {conflictInfo.map((c, idx) => (
                            <div key={idx}>
                              <span className="font-medium">{c.member}:</span>{' '}
                              {c.type === 'allergen' ? 'Allergic to' : 'Cannot eat'}{' '}
                              {c.allergens.join(', ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Made It Modal */}
      <MadeItModal
        isOpen={showMadeItModal}
        onClose={() => {
          setShowMadeItModal(false);
          navigate(`/recipes/${id}`);
        }}
        recipeId={id || ''}
        recipeTitle={recipe.title}
        onSuccess={() => {
          toast.success('Review saved! Your Flavor DNA is learning.');
        }}
      />
    </div>
  );
}
