import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  Utensils,
  Cake,
  Heart,
  Leaf,
  Star,
  Calendar,
  Zap,
  Eye,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../ui';
import { useCreateSmartCollection, useFilterPreview } from '../../hooks';
import type { FilterRules, CreateSmartCollectionDto } from '../../types/smart-collection';
import { RecipeCategory, RecipeDifficulty, RecipeSource } from '../../types/recipe';
import { COLLECTION_ICONS, COLLECTION_COLORS } from '../../types/smart-collection';

interface CreateSmartCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSmartCollectionModal({ isOpen, onClose }: CreateSmartCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('sparkles');
  const [color, setColor] = useState('purple');
  const [filterRules, setFilterRules] = useState<FilterRules>({});
  const [showPreview, setShowPreview] = useState(false);

  const createMutation = useCreateSmartCollection();
  const { data: preview, isLoading: previewLoading } = useFilterPreview(
    filterRules,
    showPreview && Object.keys(filterRules).length > 0
  );

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setIcon('sparkles');
      setColor('purple');
      setFilterRules({});
      setShowPreview(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim() || Object.keys(filterRules).length === 0) return;

    const data: CreateSmartCollectionDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      filterRules,
    };

    await createMutation.mutateAsync(data);
    onClose();
  };

  const updateFilter = (key: keyof FilterRules, value: any) => {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      const newFilters = { ...filterRules };
      delete newFilters[key];
      setFilterRules(newFilters);
    } else {
      setFilterRules({ ...filterRules, [key]: value });
    }
    setShowPreview(false);
  };

  const toggleArrayFilter = (key: 'category' | 'difficulty' | 'source', value: string) => {
    const current = filterRules[key] || [];
    const newValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, newValues.length > 0 ? newValues : undefined);
  };

  if (!isOpen) return null;

  const iconOptions = [
    { name: 'sparkles', Icon: Sparkles },
    { name: 'clock', Icon: Clock },
    { name: 'utensils', Icon: Utensils },
    { name: 'cake', Icon: Cake },
    { name: 'heart', Icon: Heart },
    { name: 'leaf', Icon: Leaf },
    { name: 'star', Icon: Star },
    { name: 'calendar', Icon: Calendar },
    { name: 'zap', Icon: Zap },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Create Smart Collection</h2>
              <p className="text-sm text-neutral-500">Auto-populate recipes based on filters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Collection Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Quick Weeknight Dinners"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Easy recipes ready in 30 minutes"
              />
            </div>

            {/* Icon & Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map(({ name: iconName, Icon }) => (
                    <button
                      key={iconName}
                      onClick={() => setIcon(iconName)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        icon === iconName
                          ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-500'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {['purple', 'blue', 'green', 'amber', 'rose', 'orange', 'teal', 'indigo'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 ring-neutral-400 scale-110' : ''
                      }`}
                      style={{
                        backgroundColor: `var(--color-${c}-500, ${getColorHex(c)})`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Rules */}
          <div className="space-y-4">
            <h3 className="font-medium text-neutral-900">Filter Rules *</h3>
            <p className="text-sm text-neutral-500">
              Recipes matching ALL selected criteria will be included
            </p>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Categories</label>
              <div className="flex flex-wrap gap-2">
                {['BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT', 'SNACK', 'APPETIZER', 'SOUP', 'SALAD'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleArrayFilter('category', cat)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      filterRules.category?.includes(cat)
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => toggleArrayFilter('difficulty', diff)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      filterRules.difficulty?.includes(diff)
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {diff.charAt(0) + diff.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Max Time (minutes)
                </label>
                <Input
                  type="number"
                  value={filterRules.maxTime || ''}
                  onChange={(e) => updateFilter('maxTime', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g., 30"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Recent (days)
                </label>
                <Input
                  type="number"
                  value={filterRules.recentDays || ''}
                  onChange={(e) => updateFilter('recentDays', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g., 7"
                  min={1}
                />
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Source</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'INSTAGRAM_URL', label: 'Instagram' },
                  { value: 'URL', label: 'Website' },
                  { value: 'TEXT', label: 'Text Input' },
                  { value: 'IMAGE', label: 'Image' },
                  { value: 'GENERATED', label: 'AI Generated' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleArrayFilter('source', value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      filterRules.source?.includes(value)
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tags (comma separated)
              </label>
              <Input
                value={filterRules.tags?.join(', ') || ''}
                onChange={(e) => {
                  const tags = e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean);
                  updateFilter('tags', tags.length > 0 ? tags : undefined);
                }}
                placeholder="e.g., vegetarian, healthy, quick"
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {Object.keys(filterRules).length > 0 && (
            <div className="p-3 bg-primary-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary-700">Active Filters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  disabled={previewLoading}
                >
                  {previewLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filterRules.category?.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    Category: {c.toLowerCase()}
                  </Badge>
                ))}
                {filterRules.difficulty?.map((d) => (
                  <Badge key={d} variant="secondary" className="text-xs">
                    Difficulty: {d.toLowerCase()}
                  </Badge>
                ))}
                {filterRules.maxTime && (
                  <Badge variant="secondary" className="text-xs">
                    Max {filterRules.maxTime} min
                  </Badge>
                )}
                {filterRules.recentDays && (
                  <Badge variant="secondary" className="text-xs">
                    Last {filterRules.recentDays} days
                  </Badge>
                )}
                {filterRules.source?.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    Source: {s.toLowerCase().replace('_', ' ')}
                  </Badge>
                ))}
                {filterRules.tags?.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    Tag: {t}
                  </Badge>
                ))}
              </div>

              {/* Preview Results */}
              {showPreview && preview && (
                <div className="mt-3 pt-3 border-t border-primary-200">
                  <p className="text-sm text-primary-700 mb-2">
                    <strong>{preview.count}</strong> recipes match this filter
                  </p>
                  {preview.recipes.length > 0 && (
                    <div className="space-y-1">
                      {preview.recipes.slice(0, 5).map((recipe) => (
                        <div key={recipe.id} className="text-sm text-primary-600 truncate">
                          • {recipe.title}
                        </div>
                      ))}
                      {preview.count > 5 && (
                        <div className="text-sm text-primary-500 italic">
                          ...and {preview.count - 5} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || Object.keys(filterRules).length === 0 || createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Collection
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Helper to get color hex values
function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    purple: '#9333ea',
    blue: '#3b82f6',
    green: '#22c55e',
    amber: '#f59e0b',
    rose: '#f43f5e',
    orange: '#f97316',
    teal: '#14b8a6',
    indigo: '#6366f1',
  };
  return colors[color] || colors.purple;
}
