import { useState } from 'react';
import {
  Clock,
  Users,
  ChefHat,
  BookOpen,
  Loader2,
  Check,
  ExternalLink,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { YouTubeExtractionResult, ExtractedRecipe } from '../../types/youtube';

interface YouTubeExtractionResultProps {
  result: YouTubeExtractionResult;
  onImport: (recipe: ExtractedRecipe, index: number) => void;
  isImporting?: boolean;
  importingIndex?: number | null;
}

/**
 * Single recipe card with expandable details
 */
function RecipeCard({
  recipe,
  index,
  isImported,
  isImporting,
  onImport,
  onPrint,
}: {
  recipe: ExtractedRecipe;
  index: number;
  isImported: boolean;
  isImporting: boolean;
  onImport: () => void;
  onPrint: () => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <Card className="overflow-hidden">
      {/* Recipe Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-start flex items-center gap-4 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900 truncate">
              {recipe.title}
            </h3>
            {isImported && (
              <Badge variant="success" size="sm">
                <Check className="h-3 w-3 me-1" />
                Imported
              </Badge>
            )}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-neutral-500">
            {recipe.prepTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Prep: {recipe.prepTimeMinutes}m
              </span>
            )}
            {recipe.cookTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Cook: {recipe.cookTimeMinutes}m
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {recipe.servings} servings
              </span>
            )}
            {recipe.difficulty && (
              <Badge
                variant={
                  recipe.difficulty === 'EASY'
                    ? 'success'
                    : recipe.difficulty === 'MEDIUM'
                      ? 'warning'
                      : 'error'
                }
                size="sm"
              >
                {recipe.difficulty}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">
            {Math.round(recipe.confidence * 100)}% confidence
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-neutral-100">
          {/* Description */}
          {recipe.description && (
            <div className="px-4 pt-4">
              <p className="text-neutral-600 text-sm">{recipe.description}</p>
            </div>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="px-4 pt-3 flex flex-wrap gap-1">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Components (Ingredients & Steps) */}
          {recipe.components.map((component, idx) => (
            <div key={idx} className="p-4 border-t border-neutral-100 first:border-t-0">
              <h4 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-primary-500" />
                {component.name}
              </h4>

              {/* Ingredients */}
              <div className="mb-4">
                <h5 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                  Ingredients
                </h5>
                <ul className="space-y-1">
                  {component.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-neutral-600 flex items-start gap-2">
                      <span className="text-primary-500 mt-0.5">•</span>
                      <span>
                        {ing.quantity && <strong>{ing.quantity} </strong>}
                        {ing.unit && <span>{ing.unit} </span>}
                        {ing.name}
                        {ing.notes && (
                          <span className="text-neutral-400"> ({ing.notes})</span>
                        )}
                        {ing.optional && (
                          <span className="text-neutral-400"> (optional)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div>
                <h5 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                  Instructions
                </h5>
                <ol className="space-y-2">
                  {component.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {step.order || i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-neutral-600">{step.instruction}</p>
                        {step.duration && (
                          <span className="text-xs text-neutral-400">~{step.duration} min</span>
                        )}
                        {step.tips && (
                          <p className="text-xs text-amber-600 mt-0.5">Tip: {step.tips}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="p-4 border-t border-neutral-100 flex justify-end gap-2 bg-neutral-50">
            <Button variant="secondary" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 me-1" />
              Print
            </Button>
            {isImported ? (
              <Button variant="secondary" size="sm" disabled>
                <Check className="h-4 w-4 me-1" />
                Imported
              </Button>
            ) : (
              <Button size="sm" onClick={onImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-1" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 me-1" />
                    Import This Recipe
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Display extracted recipes with option to import each
 */
export function YouTubeExtractionResultComponent({
  result,
  onImport,
  isImporting = false,
  importingIndex = null,
}: YouTubeExtractionResultProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const recipes = result.extractedRecipes;

  if (!recipes || recipes.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-neutral-500 text-center">
          No recipes could be extracted from this video.
        </p>
      </Card>
    );
  }

  const handlePrintRecipe = (recipe: ExtractedRecipe) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${recipe.title}</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { margin-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; }
          h2 { margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          h3 { margin-top: 20px; }
          ul, ol { padding-left: 20px; }
          li { margin: 8px 0; }
          .tip { color: #b45309; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>${recipe.title}</h1>
        <div class="meta">
          ${recipe.prepTimeMinutes ? `Prep: ${recipe.prepTimeMinutes} min | ` : ''}
          ${recipe.cookTimeMinutes ? `Cook: ${recipe.cookTimeMinutes} min | ` : ''}
          ${recipe.servings ? `Servings: ${recipe.servings}` : ''}
        </div>
        ${recipe.description ? `<p>${recipe.description}</p>` : ''}
        ${recipe.components.map(comp => `
          <h2>${comp.name}</h2>
          <h3>Ingredients</h3>
          <ul>
            ${comp.ingredients.map(ing => `
              <li>${ing.quantity || ''} ${ing.unit || ''} ${ing.name}${ing.notes ? ` (${ing.notes})` : ''}${ing.optional ? ' (optional)' : ''}</li>
            `).join('')}
          </ul>
          <h3>Instructions</h3>
          <ol>
            ${comp.steps.map(step => `
              <li>${step.instruction}${step.tips ? `<div class="tip">Tip: ${step.tips}</div>` : ''}</li>
            `).join('')}
          </ol>
        `).join('')}
        <p style="margin-top: 40px; color: #999; font-size: 0.8em;">
          Extracted from: ${result.videoTitle} (${result.youtubeUrl})
        </p>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      {/* Video Info Header */}
      <Card className="p-4">
        <div className="flex gap-4">
          {result.thumbnailUrl && (
            <img
              src={result.thumbnailUrl}
              alt={result.videoTitle || ''}
              className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-neutral-900 truncate">
              {result.videoTitle}
            </h2>
            <p className="text-sm text-neutral-500">{result.channelName}</p>
            <div className="mt-2 flex items-center gap-4">
              <Badge variant="info">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
              </Badge>
              <a
                href={result.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View video
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Recipe Cards */}
      <div className="space-y-3">
        {recipes.map((recipe, index) => (
          <RecipeCard
            key={index}
            recipe={recipe}
            index={index}
            isImported={result.importedRecipeIds?.includes(String(index)) || false}
            isImporting={isImporting && importingIndex === index}
            onImport={() => onImport(recipe, index)}
            onPrint={() => handlePrintRecipe(recipe)}
          />
        ))}
      </div>

      {/* Transcript */}
      {result.transcription && (
        <Card className="p-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
          >
            <BookOpen className="h-4 w-4" />
            <span>{showTranscript ? 'Hide' : 'Show'} Transcript</span>
          </button>
          {showTranscript && (
            <div className="mt-4 p-4 bg-neutral-50 rounded-lg max-h-60 overflow-y-auto">
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                {result.transcription}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
