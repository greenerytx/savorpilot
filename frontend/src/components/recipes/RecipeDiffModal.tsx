import { Plus, Minus, Edit3, Loader2 } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Badge } from '../ui';
import type { RecipeDiff, Ingredient, Step, MetadataDiff } from '../../types/recipe';

interface RecipeDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  diff: RecipeDiff | null;
  originalTitle: string;
  modifiedTitle: string;
  isLoading?: boolean;
}

// Format ingredient for display
function formatIngredient(ing: Ingredient): string {
  let text = '';
  if (ing.quantity) text += `${ing.quantity} `;
  if (ing.unit) text += `${ing.unit} `;
  text += ing.name;
  if (ing.notes) text += ` (${ing.notes})`;
  if (ing.optional) text += ' [optional]';
  return text;
}

// Format metadata value
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'Not set';
  if (Array.isArray(value)) return value.join(', ') || 'None';
  return String(value);
}

// Format metadata field name
function formatFieldName(field: string): string {
  const names: Record<string, string> = {
    title: 'Title',
    description: 'Description',
    servings: 'Servings',
    servingUnit: 'Serving Unit',
    prepTimeMinutes: 'Prep Time',
    cookTimeMinutes: 'Cook Time',
    difficulty: 'Difficulty',
    category: 'Category',
    cuisine: 'Cuisine',
    tags: 'Tags',
  };
  return names[field] || field;
}

// Diff item components
function AddedItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg text-green-800">
      <Plus className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="text-sm">{children}</span>
    </div>
  );
}

function RemovedItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg text-red-800">
      <Minus className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="text-sm line-through">{children}</span>
    </div>
  );
}

function ModifiedItem({
  original,
  modified,
}: {
  original: React.ReactNode;
  modified: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-amber-800">
      <Edit3 className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="text-sm">
        <span className="line-through opacity-60">{original}</span>
        <span className="mx-2">→</span>
        <span className="font-medium">{modified}</span>
      </div>
    </div>
  );
}

export function RecipeDiffModal({
  isOpen,
  onClose,
  diff,
  originalTitle,
  modifiedTitle,
  isLoading = false,
}: RecipeDiffModalProps) {
  const hasIngredientChanges = diff && (
    diff.ingredients.added.length > 0 ||
    diff.ingredients.removed.length > 0 ||
    diff.ingredients.modified.length > 0
  );

  const hasStepChanges = diff && (
    diff.steps.added.length > 0 ||
    diff.steps.removed.length > 0 ||
    diff.steps.modified.length > 0
  );

  const hasMetadataChanges = diff && diff.metadata.length > 0;

  const hasAnyChanges = hasIngredientChanges || hasStepChanges || hasMetadataChanges;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Recipe Comparison"
      className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
    >
      {/* Header showing what's being compared */}
      <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl mb-4">
        <Badge variant="outline" className="text-xs">Original</Badge>
        <span className="text-sm text-neutral-600 truncate">{originalTitle}</span>
        <span className="text-neutral-400">vs</span>
        <Badge className="text-xs bg-primary-100 text-primary-700">Modified</Badge>
        <span className="text-sm text-neutral-600 truncate">{modifiedTitle}</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
          <p className="text-sm text-neutral-500">Analyzing differences...</p>
        </div>
      ) : !diff ? (
        <div className="text-center py-8 text-neutral-500">
          Unable to load comparison data
        </div>
      ) : !hasAnyChanges ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-neutral-600 font-medium">No differences found</p>
          <p className="text-sm text-neutral-500 mt-1">
            These recipes are identical
          </p>
        </div>
      ) : (
        <div className="overflow-y-auto space-y-6 pr-2">
          {/* Metadata Changes */}
          {hasMetadataChanges && (
            <section>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                Recipe Details
              </h3>
              <div className="space-y-2">
                {diff.metadata.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-amber-800"
                  >
                    <Edit3 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">{formatFieldName(change.field)}:</span>{' '}
                      <span className="line-through opacity-60">
                        {formatValue(change.original)}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{formatValue(change.modified)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Ingredient Changes */}
          {hasIngredientChanges && (
            <section>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                Ingredients
              </h3>
              <div className="space-y-2">
                {diff.ingredients.added.map((ing, idx) => (
                  <AddedItem key={`add-${idx}`}>
                    {formatIngredient(ing)}
                  </AddedItem>
                ))}
                {diff.ingredients.removed.map((ing, idx) => (
                  <RemovedItem key={`rem-${idx}`}>
                    {formatIngredient(ing)}
                  </RemovedItem>
                ))}
                {diff.ingredients.modified.map((change, idx) => (
                  <ModifiedItem
                    key={`mod-${idx}`}
                    original={formatIngredient(change.original)}
                    modified={formatIngredient(change.modified)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Step Changes */}
          {hasStepChanges && (
            <section>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                Instructions
              </h3>
              <div className="space-y-2">
                {diff.steps.added.map((step, idx) => (
                  <AddedItem key={`add-${idx}`}>
                    Step {step.order}: {step.instruction}
                  </AddedItem>
                ))}
                {diff.steps.removed.map((step, idx) => (
                  <RemovedItem key={`rem-${idx}`}>
                    Step {step.order}: {step.instruction}
                  </RemovedItem>
                ))}
                {diff.steps.modified.map((change, idx) => (
                  <ModifiedItem
                    key={`mod-${idx}`}
                    original={`Step ${change.original.order}: ${change.original.instruction}`}
                    modified={`Step ${change.modified.order}: ${change.modified.instruction}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Summary */}
          <div className="flex gap-4 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Plus className="w-3 h-3 text-green-600" />
              {diff.ingredients.added.length + diff.steps.added.length} added
            </span>
            <span className="flex items-center gap-1">
              <Minus className="w-3 h-3 text-red-600" />
              {diff.ingredients.removed.length + diff.steps.removed.length} removed
            </span>
            <span className="flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-amber-600" />
              {diff.ingredients.modified.length + diff.steps.modified.length + diff.metadata.length} modified
            </span>
          </div>
        </div>
      )}
    </Dialog>
  );
}
