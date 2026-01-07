import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Users,
  Trash2,
  Loader2,
  ShoppingCart,
  Clock,
  Wand2,
} from 'lucide-react';
import { Button, Card, useToast } from '../../components/ui';
import {
  AddMealModal,
  NutritionSummary,
  AiMealPlanGeneratorModal,
  AiMealPlanPreview,
} from '../../components/meal-planning';
import {
  useWeekPlan,
  useCreateMealPlan,
  useAddMealEntry,
  useDeleteMealEntry,
  useMealPlanNutrition,
  getWeekStart,
  getWeekDates,
  formatDate,
  getMealTypeLabel,
  getMealTypeEmoji,
} from '../../hooks/useMealPlanning';
import { useAiMealPlanWorkflow } from '../../hooks/useAiMealPlanning';
import { useCircles } from '../../hooks/useDinnerCircles';
import { MealType } from '../../services/meal-planning.service';
import type { MealPlanEntry, GenerateMealPlanRequest } from '../../services/meal-planning.service';
import { getImageUrl, cn } from '../../lib/utils';

export function MealPlannerPage() {
  const toast = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart());
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);
  const [addMealDate, setAddMealDate] = useState<string | null>(null);
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [targetCalories, setTargetCalories] = useState<number | undefined>();

  // AI meal plan workflow
  const aiWorkflow = useAiMealPlanWorkflow();

  // Fetch data
  const { data: circles } = useCircles();
  const { data: weekPlan, isLoading } = useWeekPlan(currentWeekStart);
  const createMealPlan = useCreateMealPlan();
  const addMealEntry = useAddMealEntry();
  const deleteMealEntry = useDeleteMealEntry();
  const { data: nutrition, isLoading: nutritionLoading } = useMealPlanNutrition(
    weekPlan?.id || '',
    !!weekPlan?.id
  );

  const selectedCircle = circles?.find((c) => c.id === selectedCircleId);

  // Get week dates
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Navigate weeks
  const goToPreviousWeek = () => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() - 7);
    setCurrentWeekStart(formatDate(date));
  };

  const goToNextWeek = () => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + 7);
    setCurrentWeekStart(formatDate(date));
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart());
  };

  // Get meals for a specific date and meal type
  const getMealsForSlot = (date: string, mealType: MealType): MealPlanEntry[] => {
    if (!weekPlan?.meals) return [];
    return weekPlan.meals.filter(
      (m) => m.date === date && m.mealType === mealType
    );
  };

  // Handle add meal
  const handleAddMeal = async (recipeId: string, mealType: MealType, servings: number) => {
    if (!addMealDate) return;

    try {
      // Create plan if doesn't exist
      let planId = weekPlan?.id;
      if (!planId) {
        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);

        const newPlan = await createMealPlan.mutateAsync({
          name: `Week of ${new Date(currentWeekStart).toLocaleDateString()}`,
          startDate: currentWeekStart,
          endDate: formatDate(endDate),
          circleId: selectedCircleId || undefined,
        });
        planId = newPlan.id;
      }

      await addMealEntry.mutateAsync({
        mealPlanId: planId,
        dto: {
          recipeId,
          date: addMealDate,
          mealType,
          servings,
        },
      });

      toast.success('Meal added to plan');
    } catch (error) {
      toast.error('Failed to add meal');
    }

    setAddMealDate(null);
  };

  // Handle delete meal
  const handleDeleteMeal = async (entryId: string) => {
    if (!weekPlan?.id) return;

    try {
      await deleteMealEntry.mutateAsync({
        mealPlanId: weekPlan.id,
        entryId,
      });
      toast.success('Meal removed');
    } catch (error) {
      toast.error('Failed to remove meal');
    }
  };

  // Handle AI generation
  const handleAiGenerate = async (request: GenerateMealPlanRequest) => {
    try {
      setTargetCalories(request.targetCalories);
      await aiWorkflow.generate(request);
      setShowAiGenerator(false);
      toast.success('Meal plan generated! Review and apply below.');
    } catch (error) {
      toast.error('Failed to generate meal plan');
    }
  };

  // Handle applying generated plan
  const handleApplyPlan = async () => {
    try {
      const result = await aiWorkflow.apply(
        weekPlan?.id,
        weekPlan ? undefined : `Week of ${new Date(currentWeekStart).toLocaleDateString()}`,
        selectedCircleId || undefined
      );
      toast.success('Meal plan applied successfully!');
    } catch (error) {
      toast.error('Failed to apply meal plan');
    }
  };

  // Handle regenerating a single meal
  const handleRegenerateMeal = async (date: string, mealType: MealType) => {
    try {
      await aiWorkflow.regenerateMeal(date, mealType);
      toast.success('Meal swapped');
    } catch (error) {
      toast.error('Failed to swap meal');
    }
  };

  // Format week range for header
  const weekRangeText = useMemo(() => {
    const start = new Date(currentWeekStart);
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${end.getFullYear()}`;
  }, [currentWeekStart]);

  const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">Meal Planner</h1>
          <p className="text-primary-600">Plan your meals for the week</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Circle Selector */}
          {circles && circles.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
              <Users className="w-4 h-4 text-primary-500" />
              <select
                value={selectedCircleId || ''}
                onChange={(e) => setSelectedCircleId(e.target.value || null)}
                className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                <option value="">All Recipes</option>
                {circles.map((circle) => (
                  <option key={circle.id} value={circle.id}>
                    {circle.emoji || '👥'} {circle.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAiGenerator(true)}
          >
            <Wand2 className="w-4 h-4" />
            AI Generate
          </Button>

          {weekPlan && (
            <Link to={`/shopping?mealPlanId=${weekPlan.id}`}>
              <Button variant="outline" size="sm">
                <ShoppingCart className="w-4 h-4" />
                Generate List
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              <span className="text-lg font-semibold text-neutral-800">
                {weekRangeText}
              </span>
            </div>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDates.map((date) => {
                const isToday = formatDate(date) === formatDate(new Date());
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = date.getDate();

                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'text-center py-2 rounded-lg',
                      isToday ? 'bg-primary-100 text-primary-700' : 'bg-neutral-50'
                    )}
                  >
                    <p className="text-xs font-medium text-neutral-500">{dayName}</p>
                    <p className={cn('text-lg font-bold', isToday && 'text-primary-600')}>
                      {dayNum}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Meal Rows */}
            {mealTypes.map((mealType) => (
              <div key={mealType} className="mb-4">
                {/* Meal Type Header */}
                <div className="flex items-center gap-2 mb-2 px-2">
                  <span className="text-lg">{getMealTypeEmoji(mealType)}</span>
                  <span className="text-sm font-medium text-neutral-600">
                    {getMealTypeLabel(mealType)}
                  </span>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDates.map((date) => {
                    const dateStr = formatDate(date);
                    const meals = getMealsForSlot(dateStr, mealType);

                    return (
                      <div
                        key={`${dateStr}-${mealType}`}
                        className="min-h-[100px] bg-white border border-neutral-200 rounded-lg p-2 space-y-2"
                      >
                        {/* Existing Meals */}
                        {meals.map((meal) => (
                          <MealCard
                            key={meal.id}
                            meal={meal}
                            onDelete={() => handleDeleteMeal(meal.id)}
                          />
                        ))}

                        {/* Add Button */}
                        <button
                          onClick={() => setAddMealDate(dateStr)}
                          className="w-full py-2 border-2 border-dashed border-neutral-200 rounded-lg text-neutral-400 hover:border-primary-300 hover:text-primary-500 transition-colors flex items-center justify-center gap-1 text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Summary */}
      {weekPlan && (
        <NutritionSummary
          nutrition={nutrition}
          isLoading={nutritionLoading}
        />
      )}

      {/* Add Meal Modal */}
      <AddMealModal
        isOpen={!!addMealDate}
        onClose={() => setAddMealDate(null)}
        onAdd={handleAddMeal}
        date={addMealDate || ''}
        circleId={selectedCircleId || undefined}
        defaultServings={selectedCircle?.memberCount || 4}
      />

      {/* AI Meal Plan Generator Modal */}
      <AiMealPlanGeneratorModal
        isOpen={showAiGenerator}
        onClose={() => setShowAiGenerator(false)}
        onGenerate={handleAiGenerate}
        isLoading={aiWorkflow.isGenerating}
        error={aiWorkflow.generateError}
        circles={circles?.map((c) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          memberCount: c.memberCount,
        }))}
        defaultStartDate={currentWeekStart}
      />

      {/* AI Meal Plan Preview */}
      {aiWorkflow.preview && (
        <AiMealPlanPreview
          preview={aiWorkflow.preview}
          onApply={handleApplyPlan}
          onClose={() => aiWorkflow.clearPreview()}
          onRegenerateMeal={handleRegenerateMeal}
          isApplying={aiWorkflow.isApplying}
          isRegenerating={aiWorkflow.isRegenerating}
          targetCalories={targetCalories}
        />
      )}
    </div>
  );
}

// Meal Card Component
function MealCard({
  meal,
  onDelete,
}: {
  meal: MealPlanEntry;
  onDelete: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <Link to={`/recipes/${meal.recipeId}`}>
      <div className="group relative bg-neutral-50 rounded-lg overflow-hidden hover:bg-neutral-100 transition-colors">
        {/* Image */}
        {meal.recipe?.imageUrl && (
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={getImageUrl(meal.recipe.imageUrl)}
              alt={meal.recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-2">
          <p className="text-xs font-medium text-neutral-800 line-clamp-2">
            {meal.recipe?.title || 'Recipe'}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {meal.servings}
            </span>
            {meal.recipe?.prepTimeMinutes || meal.recipe?.cookTimeMinutes ? (
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {(meal.recipe.prepTimeMinutes || 0) + (meal.recipe.cookTimeMinutes || 0)}m
              </span>
            ) : null}
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-red-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isDeleting ? (
            <Loader2 className="w-3 h-3 animate-spin text-red-500" />
          ) : (
            <Trash2 className="w-3 h-3 text-red-500" />
          )}
        </button>
      </div>
    </Link>
  );
}

export default MealPlannerPage;
