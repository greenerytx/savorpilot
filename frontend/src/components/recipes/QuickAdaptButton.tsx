import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, ChevronDown, Loader2, Leaf, Wheat, Flame, Heart, Clock, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAutoForkTemplates, useApplyAutoFork } from '../../hooks/useForkEnhancements';
import { useToast } from '../ui';
import type { AutoForkTemplate } from '../../services/fork-enhancements.service';

interface QuickAdaptButtonProps {
  recipeId: string;
  /** Compact mode for recipe cards */
  compact?: boolean;
  className?: string;
}

// Most popular dietary adaptations for quick access - IDs must match backend AUTO_FORK_TEMPLATES
const QUICK_TEMPLATES = [
  { id: 'vegan', icon: Leaf, label: 'Make it Vegan', color: 'text-green-600' },
  { id: 'gluten-free', icon: Wheat, label: 'Gluten-Free', color: 'text-amber-600' },
  { id: 'keto', icon: Flame, label: 'Make it Keto', color: 'text-orange-600' },
  { id: 'low-calorie', icon: Heart, label: 'Lighter Version', color: 'text-rose-500' },
  { id: 'quick-version', icon: Clock, label: '30-Min Version', color: 'text-blue-500' },
  { id: 'air-fryer', icon: DollarSign, label: 'Air Fryer', color: 'text-emerald-600' },
];

export function QuickAdaptButton({ recipeId, compact = false, className }: QuickAdaptButtonProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: templates } = useAutoForkTemplates();
  const applyAutoFork = useApplyAutoFork();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAdapt = async (templateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setApplyingTemplate(templateId);
    try {
      const result = await applyAutoFork.mutateAsync({ recipeId, templateId });

      if (result.success && result.newRecipeId) {
        toast.success('Recipe adapted! Opening your new version...');
        setIsOpen(false);
        navigate(`/recipes/${result.newRecipeId}`);
      } else {
        toast.error(result.error || 'Failed to adapt recipe');
      }
    } catch (err) {
      toast.error('Failed to adapt recipe');
    } finally {
      setApplyingTemplate(null);
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Get available templates matching our quick list
  const availableQuickTemplates = QUICK_TEMPLATES.filter(qt =>
    templates?.some(t => t.id === qt.id)
  );

  if (compact) {
    return (
      <div ref={dropdownRef} className={cn('relative', className)}>
        <button
          onClick={toggleDropdown}
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium',
            'bg-gradient-to-r from-violet-500 to-purple-600 text-white',
            'hover:from-violet-600 hover:to-purple-700',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400'
          )}
          title="Quick dietary adaptations"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Adapt</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-cream-200 py-1 z-50 animate-scale-in">
            <div className="px-3 py-2 border-b border-cream-100">
              <p className="text-xs font-semibold text-primary-700">Quick Adapt</p>
              <p className="text-[10px] text-primary-400">One-click dietary changes</p>
            </div>
            {availableQuickTemplates.map((qt) => {
              const Icon = qt.icon;
              const isApplying = applyingTemplate === qt.id;
              return (
                <button
                  key={qt.id}
                  onClick={(e) => handleQuickAdapt(qt.id, e)}
                  disabled={!!applyingTemplate}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                    'hover:bg-cream-50 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isApplying ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  ) : (
                    <Icon className={cn('w-4 h-4', qt.color)} />
                  )}
                  <span className="text-primary-700">{qt.label}</span>
                </button>
              );
            })}
            <div className="border-t border-cream-100 mt-1 pt-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                  navigate(`/recipes/${recipeId}?tab=forks`);
                }}
                className="w-full px-3 py-2 text-left text-xs text-primary-500 hover:bg-cream-50 transition-colors"
              >
                View all templates →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full button for detail page
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={toggleDropdown}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl font-medium',
          'bg-gradient-to-r from-violet-500 to-purple-600 text-white',
          'hover:from-violet-600 hover:to-purple-700',
          'shadow-md hover:shadow-lg transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400'
        )}
      >
        <Wand2 className="w-4 h-4" />
        <span>Quick Adapt</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-cream-200 py-2 z-50 animate-scale-in">
          <div className="px-4 py-2 border-b border-cream-100">
            <p className="font-semibold text-primary-800">Quick Adapt</p>
            <p className="text-xs text-primary-400">One-click dietary adaptations</p>
          </div>
          <div className="py-2">
            {availableQuickTemplates.map((qt) => {
              const Icon = qt.icon;
              const template = templates?.find(t => t.id === qt.id);
              const isApplying = applyingTemplate === qt.id;

              return (
                <button
                  key={qt.id}
                  onClick={(e) => handleQuickAdapt(qt.id, e)}
                  disabled={!!applyingTemplate}
                  className={cn(
                    'w-full px-4 py-2.5 text-left flex items-center gap-3',
                    'hover:bg-cream-50 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    'bg-gradient-to-br from-cream-100 to-cream-200'
                  )}>
                    {isApplying ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    ) : (
                      <Icon className={cn('w-4 h-4', qt.color)} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-primary-800">{qt.label}</p>
                    {template && (
                      <p className="text-xs text-primary-400 line-clamp-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-cream-100 px-4 pt-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                navigate(`/recipes/${recipeId}?tab=forks`);
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              See all adaptation templates →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
