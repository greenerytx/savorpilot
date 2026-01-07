import { useState } from 'react';
import { GitFork, Loader2, Globe, Lock, Users, Wand2, Leaf, Wheat, Flame, Heart, Clock, DollarSign, ChevronRight, Check } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button, Input } from '../ui';
import { cn, getImageUrl } from '../../lib/utils';
import { useAutoForkTemplates, useApplyAutoFork } from '../../hooks/useForkEnhancements';
import type { Recipe, RecipeVisibility } from '../../types/recipe';

interface ForkModalProps {
  recipe: Recipe;
  isOpen: boolean;
  onClose: () => void;
  onFork: (forkNote?: string, visibility?: RecipeVisibility) => void;
  isLoading?: boolean;
}

// Quick adapt templates with icons - IDs must match backend AUTO_FORK_TEMPLATES
const QUICK_TEMPLATES = [
  { id: 'vegan', icon: Leaf, label: 'Make it Vegan', color: 'text-green-600', bg: 'bg-green-50 hover:bg-green-100 border-green-200' },
  { id: 'gluten-free', icon: Wheat, label: 'Gluten-Free', color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { id: 'keto', icon: Flame, label: 'Make it Keto', color: 'text-orange-600', bg: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
  { id: 'low-calorie', icon: Heart, label: 'Lighter Version', color: 'text-rose-500', bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200' },
  { id: 'quick-version', icon: Clock, label: '30-Min Version', color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { id: 'air-fryer', icon: DollarSign, label: 'Air Fryer', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
];

export function ForkModal({
  recipe,
  isOpen,
  onClose,
  onFork,
  isLoading = false,
}: ForkModalProps) {
  const [forkNote, setForkNote] = useState('');
  const [visibility, setVisibility] = useState<RecipeVisibility>('PRIVATE');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [mode, setMode] = useState<'manual' | 'quick'>('manual');
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

  const { data: templates } = useAutoForkTemplates();
  const applyAutoFork = useApplyAutoFork();

  // Get available templates that exist in backend
  const availableTemplates = QUICK_TEMPLATES.filter(qt =>
    templates?.some(t => t.id === qt.id)
  );

  const visibilityOptions = [
    { value: 'PRIVATE' as RecipeVisibility, label: 'Private', description: 'Only you can see', icon: Lock },
    { value: 'FOLLOWERS' as RecipeVisibility, label: 'Followers', description: 'Your followers can see', icon: Users },
    { value: 'PUBLIC' as RecipeVisibility, label: 'Public', description: 'Everyone can see', icon: Globe },
  ];

  const currentVisibility = visibilityOptions.find(v => v.value === visibility) || visibilityOptions[0];

  const handleFork = () => {
    onFork(forkNote || undefined, visibility);
  };

  const handleQuickAdapt = async (templateId: string) => {
    setApplyingTemplate(templateId);
    try {
      const result = await applyAutoFork.mutateAsync({
        recipeId: recipe.id,
        templateId
      });
      if (result.success && result.newRecipeId) {
        handleClose();
        // Navigation happens in parent via onSuccess
        window.location.href = `/recipes/${result.newRecipeId}`;
      }
    } catch (err) {
      console.error('Quick adapt failed:', err);
    } finally {
      setApplyingTemplate(null);
    }
  };

  const handleClose = () => {
    if (!isLoading && !applyingTemplate) {
      setForkNote('');
      setVisibility('PRIVATE');
      setShowVisibilityMenu(false);
      setMode('manual');
      onClose();
    }
  };

  const isDisabled = isLoading || !!applyingTemplate;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Fork Recipe"
      description="Create your own version of this recipe"
      className="max-w-lg"
    >
      <div className="space-y-4">
        {/* Recipe Preview */}
        <div className="flex gap-3 p-3 bg-neutral-50 rounded-xl">
          {recipe.imageUrl ? (
            <img
              src={getImageUrl(recipe.imageUrl)}
              alt={recipe.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-neutral-200 rounded-lg flex items-center justify-center">
              <GitFork className="w-6 h-6 text-neutral-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-neutral-900 truncate">{recipe.title}</h4>
            <p className="text-sm text-neutral-500 line-clamp-2">
              {recipe.description || 'No description'}
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
          <button
            onClick={() => setMode('manual')}
            disabled={isDisabled}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
              mode === 'manual'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            )}
          >
            <GitFork className="w-4 h-4" />
            Manual Fork
          </button>
          <button
            onClick={() => setMode('quick')}
            disabled={isDisabled || availableTemplates.length === 0}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
              mode === 'quick'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900',
              availableTemplates.length === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Wand2 className="w-4 h-4" />
            Quick Adapt
          </button>
        </div>

        {mode === 'manual' ? (
          <>
            {/* Fork Note */}
            <div>
              <label htmlFor="forkNote" className="block text-sm font-medium text-neutral-700 mb-1">
                What changes are you making? (optional)
              </label>
              <Input
                id="forkNote"
                placeholder="e.g., Made it vegan, reduced sugar, added extra spice..."
                value={forkNote}
                onChange={(e) => setForkNote(e.target.value)}
                maxLength={500}
                disabled={isDisabled}
              />
              <p className="mt-1 text-xs text-neutral-400">
                {forkNote.length}/500 characters
              </p>
            </div>

            {/* Visibility Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Visibility
              </label>
              <button
                type="button"
                onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors',
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-2">
                  <currentVisibility.icon className={cn(
                    'w-5 h-5',
                    visibility === 'PUBLIC' ? 'text-green-500' : visibility === 'FOLLOWERS' ? 'text-blue-500' : 'text-neutral-500'
                  )} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-neutral-900">
                      {currentVisibility.label}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {currentVisibility.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4 text-neutral-400 transition-transform',
                  showVisibilityMenu && 'rotate-90'
                )} />
              </button>

              {showVisibilityMenu && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {visibilityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setVisibility(option.value);
                        setShowVisibilityMenu(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 text-left text-sm hover:bg-neutral-50 flex items-center gap-3 transition-colors',
                        visibility === option.value && 'bg-primary-50'
                      )}
                    >
                      <option.icon className={cn(
                        'w-4 h-4',
                        visibility === option.value ? 'text-primary-500' : 'text-neutral-500'
                      )} />
                      <div className="flex-1">
                        <div className={cn(
                          'font-medium',
                          visibility === option.value && 'text-primary-600'
                        )}>
                          {option.label}
                        </div>
                        <div className="text-xs text-neutral-500">{option.description}</div>
                      </div>
                      {visibility === option.value && (
                        <Check className="w-4 h-4 text-primary-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isDisabled}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFork}
                disabled={isDisabled}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Forking...
                  </>
                ) : (
                  <>
                    <GitFork className="w-4 h-4" />
                    Fork Recipe
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Quick Adapt Templates */}
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                AI will automatically adapt the recipe for your dietary needs:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {availableTemplates.map((template) => {
                  const Icon = template.icon;
                  const isApplying = applyingTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleQuickAdapt(template.id)}
                      disabled={isDisabled}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl border transition-all text-left',
                        template.bg,
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {isApplying ? (
                        <Loader2 className={cn('w-5 h-5 animate-spin', template.color)} />
                      ) : (
                        <Icon className={cn('w-5 h-5', template.color)} />
                      )}
                      <span className="flex-1 text-sm font-medium text-neutral-800">
                        {template.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cancel Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isDisabled}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
