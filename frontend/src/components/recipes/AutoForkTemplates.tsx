import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAutoForkTemplatesByCategory,
  useAutoForkPreview,
  useApplyAutoFork,
} from '../../hooks/useForkEnhancements';
import type { AutoForkTemplate, AutoForkPreview } from '../../services/fork-enhancements.service';

interface AutoForkTemplatesProps {
  recipeId: string;
  onForkCreated?: (newRecipeId: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  dietary: { label: 'Dietary', icon: '🥗' },
  cooking_method: { label: 'Cooking Method', icon: '🍳' },
  time: { label: 'Time Saving', icon: '⏱️' },
  health: { label: 'Health', icon: '💚' },
  skill: { label: 'Skill Level', icon: '👨‍🍳' },
};

export function AutoForkTemplates({ recipeId, onForkCreated }: AutoForkTemplatesProps) {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: templatesByCategory, isLoading } = useAutoForkTemplatesByCategory();
  const { data: preview, isLoading: isPreviewLoading } = useAutoForkPreview(
    recipeId,
    showPreview ? selectedTemplate : null,
  );
  const applyAutoFork = useApplyAutoFork();

  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowPreview(true);
  };

  const handleApplyFork = async () => {
    if (!selectedTemplate) return;

    const result = await applyAutoFork.mutateAsync({
      recipeId,
      templateId: selectedTemplate,
    });

    if (result.success && result.newRecipeId) {
      if (onForkCreated) {
        onForkCreated(result.newRecipeId);
      } else {
        navigate(`/recipes/${result.newRecipeId}`);
      }
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return <AutoForkTemplatesSkeleton />;
  }

  if (!templatesByCategory) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-2">
          <span>⚡</span> Quick Fork Templates
        </h3>
        <p className="text-sm text-neutral-500">
          One-tap recipe modifications - select a template to preview changes
        </p>
      </div>

      {Object.entries(templatesByCategory).map(([category, templates]) => (
        <CategorySection
          key={category}
          category={category}
          templates={templates}
          selectedTemplate={selectedTemplate}
          onTemplateClick={handleTemplateClick}
        />
      ))}

      {showPreview && selectedTemplate && (
        <PreviewModal
          preview={preview}
          isLoading={isPreviewLoading}
          isApplying={applyAutoFork.isPending}
          onApply={handleApplyFork}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}

function AutoForkTemplatesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 bg-neutral-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 bg-neutral-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function CategorySection({
  category,
  templates,
  selectedTemplate,
  onTemplateClick,
}: {
  category: string;
  templates: AutoForkTemplate[];
  selectedTemplate: string | null;
  onTemplateClick: (id: string) => void;
}) {
  const { label, icon } = CATEGORY_LABELS[category] || { label: category, icon: '📋' };

  return (
    <div>
      <h4 className="text-sm font-medium text-neutral-600 mb-2 flex items-center gap-1">
        <span>{icon}</span> {label}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onClick={() => onTemplateClick(template.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: AutoForkTemplate;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        p-3 rounded-lg border text-left transition-all hover:shadow-md
        ${isSelected
          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
          : 'border-neutral-200 bg-white hover:border-primary-300'
        }
      `}
    >
      <span className="text-2xl block mb-1">{template.icon}</span>
      <div className="font-medium text-neutral-800 text-sm">{template.name}</div>
      <div className="text-xs text-neutral-500 line-clamp-2">{template.description}</div>
    </button>
  );
}

function PreviewModal({
  preview,
  isLoading,
  isApplying,
  onApply,
  onClose,
}: {
  preview: AutoForkPreview | undefined;
  isLoading: boolean;
  isApplying: boolean;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {isLoading ? 'Loading preview...' : preview?.template.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <PreviewSkeleton />
          ) : preview ? (
            <PreviewContent preview={preview} />
          ) : (
            <p className="text-neutral-500">Failed to load preview</p>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            disabled={isLoading || isApplying}
            className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isApplying ? (
              <>
                <span className="animate-spin">⏳</span> Creating...
              </>
            ) : (
              <>
                <span>🍴</span> Create Fork
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-neutral-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function PreviewContent({ preview }: { preview: AutoForkPreview }) {
  const { suggestedChanges, estimatedDifficulty, warnings } = preview;

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[estimatedDifficulty]}`}
        >
          {estimatedDifficulty.charAt(0).toUpperCase() + estimatedDifficulty.slice(1)} changes
        </span>
        <span className="text-2xl">{preview.template.icon}</span>
      </div>

      <p className="text-neutral-600">{preview.template.description}</p>

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
            <span>⚠️</span> Heads up
          </div>
          <ul className="text-sm text-amber-700 space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestedChanges.ingredientChanges.length > 0 && (
        <div>
          <h4 className="font-medium text-neutral-800 mb-2 flex items-center gap-1">
            <span>🥕</span> Ingredient Changes
          </h4>
          <ul className="space-y-2">
            {suggestedChanges.ingredientChanges.map((change, idx) => (
              <li key={idx} className="text-sm p-2 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ChangeActionBadge action={change.action} />
                  {change.original && (
                    <span className="line-through text-neutral-400">{change.original}</span>
                  )}
                  {change.replacement && (
                    <>
                      <span>→</span>
                      <span className="text-green-600 font-medium">{change.replacement}</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-1">{change.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestedChanges.stepChanges.length > 0 && (
        <div>
          <h4 className="font-medium text-neutral-800 mb-2 flex items-center gap-1">
            <span>📝</span> Step Changes
          </h4>
          <ul className="space-y-2">
            {suggestedChanges.stepChanges.map((change, idx) => (
              <li key={idx} className="text-sm p-2 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <StepActionBadge action={change.action} />
                  <span>{change.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestedChanges.metadataChanges.length > 0 && (
        <div>
          <h4 className="font-medium text-neutral-800 mb-2 flex items-center gap-1">
            <span>ℹ️</span> Other Changes
          </h4>
          <ul className="space-y-1">
            {suggestedChanges.metadataChanges.map((change, idx) => (
              <li key={idx} className="text-sm flex items-center gap-2">
                <span className="font-medium">{change.field}:</span>
                <span className="line-through text-neutral-400">{change.oldValue}</span>
                <span>→</span>
                <span className="text-green-600">{change.newValue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
        <div className="text-sm text-primary-800">
          <span className="font-medium">Fork Note:</span> {preview.template.forkNote}
        </div>
        {preview.template.forkTags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {preview.template.forkTags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ChangeActionBadge({ action }: { action: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    substitute: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Swap' },
    remove: { bg: 'bg-red-100', text: 'text-red-700', label: 'Remove' },
    reduce: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Reduce' },
    increase: { bg: 'bg-green-100', text: 'text-green-700', label: 'Increase' },
  };

  const { bg, text, label } = config[action] || config.substitute;

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${bg} ${text}`}>{label}</span>
  );
}

function StepActionBadge({ action }: { action: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    modify: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Modify' },
    add: { bg: 'bg-green-100', text: 'text-green-700', label: 'Add' },
    remove: { bg: 'bg-red-100', text: 'text-red-700', label: 'Remove' },
  };

  const { bg, text, label } = config[action] || config.modify;

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${bg} ${text}`}>{label}</span>
  );
}
