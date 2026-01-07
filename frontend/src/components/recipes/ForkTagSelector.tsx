import { useState, useEffect } from 'react';
import { Check, X, Tag, Loader2 } from 'lucide-react';
import { Button, Card } from '../ui';
import { cn } from '../../lib/utils';
import { useForkTagOptions, useUpdateForkTags } from '../../hooks';
import { FORK_TAG_OPTIONS } from '../../services/fork-enhancements.service';

interface ForkTagSelectorProps {
  recipeId: string;
  currentTags: string[];
  onTagsUpdated?: (tags: string[]) => void;
  className?: string;
  mode?: 'inline' | 'modal';
}

const TAG_COLORS: Record<string, string> = {
  healthier: 'bg-green-100 text-green-700 border-green-200',
  vegan: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  vegetarian: 'bg-lime-100 text-lime-700 border-lime-200',
  'gluten-free': 'bg-amber-100 text-amber-700 border-amber-200',
  'dairy-free': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  keto: 'bg-purple-100 text-purple-700 border-purple-200',
  'low-carb': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  quick: 'bg-blue-100 text-blue-700 border-blue-200',
  'budget-friendly': 'bg-teal-100 text-teal-700 border-teal-200',
  'kid-friendly': 'bg-pink-100 text-pink-700 border-pink-200',
  spicier: 'bg-red-100 text-red-700 border-red-200',
  milder: 'bg-sky-100 text-sky-700 border-sky-200',
  simplified: 'bg-slate-100 text-slate-700 border-slate-200',
  elevated: 'bg-violet-100 text-violet-700 border-violet-200',
};

export function ForkTagSelector({
  recipeId,
  currentTags,
  onTagsUpdated,
  className,
  mode = 'inline',
}: ForkTagSelectorProps) {
  const { data: tagOptions } = useForkTagOptions();
  const updateTagsMutation = useUpdateForkTags();
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [isEditing, setIsEditing] = useState(mode === 'inline');

  useEffect(() => {
    setSelectedTags(currentTags);
  }, [currentTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = async () => {
    await updateTagsMutation.mutateAsync({ recipeId, tags: selectedTags });
    onTagsUpdated?.(selectedTags);
    if (mode === 'modal') {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setSelectedTags(currentTags);
    if (mode === 'modal') {
      setIsEditing(false);
    }
  };

  const hasChanges =
    JSON.stringify(selectedTags.sort()) !==
    JSON.stringify(currentTags.sort());

  // Read-only display
  if (mode === 'modal' && !isEditing) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {currentTags.length === 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-neutral-500"
          >
            <Tag className="w-4 h-4 mr-1" />
            Add tags
          </Button>
        ) : (
          <>
            {currentTags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium border',
                  TAG_COLORS[tag] || 'bg-neutral-100 text-neutral-700',
                )}
              >
                {formatTagLabel(tag)}
              </span>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              Edit
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-neutral-800 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Fork Categories
        </h4>
        {mode === 'modal' && (
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-sm text-neutral-500 mb-4">
        Tag your fork to help others find it
      </p>

      <div className="flex flex-wrap gap-2">
        {FORK_TAG_OPTIONS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                isSelected
                  ? TAG_COLORS[tag] || 'bg-primary-100 text-primary-700'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300',
              )}
            >
              {isSelected && <Check className="w-3 h-3 inline mr-1" />}
              {formatTagLabel(tag)}
            </button>
          );
        })}
      </div>

      {hasChanges && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={updateTagsMutation.isPending}
          >
            {updateTagsMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            Save Tags
          </Button>
        </div>
      )}
    </Card>
  );
}

function formatTagLabel(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Display-only component for showing tags
export function ForkTagBadges({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  if (tags.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium border',
            TAG_COLORS[tag] || 'bg-neutral-100 text-neutral-700',
          )}
        >
          {formatTagLabel(tag)}
        </span>
      ))}
    </div>
  );
}
