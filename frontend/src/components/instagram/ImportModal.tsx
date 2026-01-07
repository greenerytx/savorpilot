import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, AlertTriangle, Sparkles, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { useParsePost, useImportPost, useGenerateSteps } from '../../hooks/useInstagram';
import type { SavedInstagramPost, ParsedInstagramPost, ImportSinglePostDto } from '../../types/instagram';

interface ImportModalProps {
  post: SavedInstagramPost;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (recipeId: string) => void;
}

export function ImportModal({ post, isOpen, onClose, onSuccess }: ImportModalProps) {
  const { t } = useTranslation('instagram');
  const { t: tRecipes } = useTranslation('recipes');
  const [parsedData, setParsedData] = useState<ParsedInstagramPost | null>(null);
  const [editedData, setEditedData] = useState<Partial<ImportSinglePostDto>>({});
  const [showOriginalCaption, setShowOriginalCaption] = useState(false);

  const parsePost = useParsePost();
  const importPost = useImportPost();
  const generateSteps = useGenerateSteps();

  // Parse post when modal opens
  useEffect(() => {
    if (isOpen && post && !parsedData) {
      parsePost.mutate(post.id, {
        onSuccess: (data) => {
          setParsedData(data);
          setEditedData({
            title: data.title,
            description: data.description,
            prepTimeMinutes: data.prepTimeMinutes,
            cookTimeMinutes: data.cookTimeMinutes,
            servings: data.servings,
            difficulty: data.difficulty,
            category: data.category,
            cuisine: data.cuisine,
            tags: data.tags,
            components: data.components,
            sourceAuthor: post.ownerUsername, // Default to Instagram username
          });
        },
      });
    }
  }, [isOpen, post?.id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setParsedData(null);
      setEditedData({});
    }
  }, [isOpen]);

  const handleGenerateSteps = () => {
    if (!parsedData || !editedData.components?.[0]) return;

    const allIngredients = editedData.components.flatMap((c) => c.ingredients);

    generateSteps.mutate(
      {
        id: post.id,
        dto: {
          title: editedData.title || 'Recipe',
          ingredients: allIngredients,
        },
      },
      {
        onSuccess: (data) => {
          if (editedData.components) {
            const updatedComponents = [...editedData.components];
            updatedComponents[0] = {
              ...updatedComponents[0],
              steps: data.steps,
            };
            setEditedData({ ...editedData, components: updatedComponents });
          }
        },
      }
    );
  };

  const handleImport = () => {
    if (!editedData.title || !editedData.components) return;

    importPost.mutate(
      {
        id: post.id,
        dto: editedData as ImportSinglePostDto,
      },
      {
        onSuccess: (data) => {
          onSuccess(data.recipeId);
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  const hasSteps = editedData.components?.some((c) => c.steps && c.steps.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-white rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t('import.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading state */}
          {parsePost.isPending && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
              <p className="text-neutral-600">{t('import.analyzing')}</p>
            </div>
          )}

          {/* Error state */}
          {parsePost.isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-red-600 font-medium mb-2">{t('import.failedToParse')}</p>
              <p className="text-neutral-500 text-sm mb-4">
                {parsePost.error?.message || t('import.errorMessage')}
              </p>
              <button
                onClick={() => parsePost.mutate(post.id)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                {t('import.tryAgain')}
              </button>
            </div>
          )}

          {/* Parsed content */}
          {parsedData && !parsePost.isPending && (
            <div className="space-y-6">
              {/* Confidence indicator */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-500">{t('import.aiConfidence')}</span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden max-w-[200px]">
                  <div
                    className={`h-full rounded-full ${
                      parsedData.confidence >= 0.7
                        ? 'bg-green-500'
                        : parsedData.confidence >= 0.4
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${parsedData.confidence * 100}%` }}
                  />
                </div>
                <span
                  className={`font-medium ${
                    parsedData.confidence >= 0.7
                      ? 'text-green-600'
                      : parsedData.confidence >= 0.4
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {Math.round(parsedData.confidence * 100)}%
                </span>
              </div>

              {/* Language warning */}
              {parsedData.needsTranslation && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg">
                  <Languages className="w-5 h-5" />
                  <span className="text-sm">
                    {t('import.translationAvailable', { language: parsedData.detectedLanguage })}
                  </span>
                </div>
              )}

              {/* Missing steps warning */}
              {!hasSteps && (
                <div className="flex items-center justify-between p-3 bg-amber-50 text-amber-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm">{t('import.noStepsDetected')}</span>
                  </div>
                  <button
                    onClick={handleGenerateSteps}
                    disabled={generateSteps.isPending}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    {generateSteps.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {t('import.generateWithAI')}
                  </button>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {tRecipes('form.title')}
                </label>
                <input
                  type="text"
                  value={editedData.title || ''}
                  onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {tRecipes('form.description')}
                </label>
                <textarea
                  value={editedData.description || ''}
                  onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {tRecipes('form.author')}
                </label>
                <input
                  type="text"
                  value={editedData.sourceAuthor || ''}
                  onChange={(e) => setEditedData({ ...editedData, sourceAuthor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={post.ownerUsername ? `@${post.ownerUsername}` : ''}
                />
              </div>

              {/* Metadata row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {tRecipes('form.prepTime')}
                  </label>
                  <input
                    type="number"
                    value={editedData.prepTimeMinutes || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        prepTimeMinutes: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {tRecipes('form.cookTime')}
                  </label>
                  <input
                    type="number"
                    value={editedData.cookTimeMinutes || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        cookTimeMinutes: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {tRecipes('form.servings')}
                  </label>
                  <input
                    type="number"
                    value={editedData.servings || ''}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        servings: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {tRecipes('form.difficulty')}
                  </label>
                  <select
                    value={editedData.difficulty || ''}
                    onChange={(e) => setEditedData({ ...editedData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{tRecipes('form.selectDifficulty')}</option>
                    <option value="EASY">{tRecipes('difficulty.easy')}</option>
                    <option value="MEDIUM">{tRecipes('difficulty.medium')}</option>
                    <option value="HARD">{tRecipes('difficulty.hard')}</option>
                    <option value="EXPERT">{tRecipes('difficulty.expert')}</option>
                  </select>
                </div>
              </div>

              {/* Ingredients preview */}
              {editedData.components && editedData.components.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">
                    {tRecipes('form.ingredientsCount', { count: editedData.components.reduce((sum, c) => sum + c.ingredients.length, 0) })}
                  </h3>
                  <div className="p-3 bg-neutral-50 rounded-lg max-h-[200px] overflow-y-auto">
                    {editedData.components.map((component, idx) => (
                      <div key={idx}>
                        {editedData.components!.length > 1 && (
                          <p className="font-medium text-sm mb-1">{component.name}</p>
                        )}
                        <ul className="text-sm text-neutral-600 space-y-1 mb-2">
                          {component.ingredients.map((ing, iIdx) => (
                            <li key={iIdx}>
                              {ing.quantity} {ing.unit} {ing.name}
                              {ing.notes && <span className="text-neutral-400"> ({ing.notes})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps preview */}
              {hasSteps && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-2">
                    {tRecipes('form.stepsCount', { count: editedData.components?.reduce((sum, c) => sum + c.steps.length, 0) })}
                  </h3>
                  <div className="p-3 bg-neutral-50 rounded-lg max-h-[200px] overflow-y-auto">
                    <ol className="text-sm text-neutral-600 space-y-2 list-decimal list-inside">
                      {editedData.components?.flatMap((c) => c.steps).map((step, idx) => (
                        <li key={idx}>{step.instruction}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Original caption toggle */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowOriginalCaption(!showOriginalCaption)}
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-800"
                >
                  {showOriginalCaption ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {t('import.viewOriginalCaption')}
                </button>
                {showOriginalCaption && (
                  <div className="mt-2 p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-600 whitespace-pre-wrap">{post.caption}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
          >
            {t('import.cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={!parsedData || importPost.isPending || !editedData.title}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importPost.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('import.importRecipe')}
          </button>
        </div>
      </div>
    </div>
  );
}
