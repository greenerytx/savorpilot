import { useState } from 'react';
import { ThumbsDown, ThumbsUp, Check } from 'lucide-react';
import { useRecordSeasoningFeedback } from '../../hooks/useFlavorDna';
import { SeasoningDimension, SeasoningLevel } from '../../services/flavor-dna.service';
import { cn } from '../../lib/utils';

interface SaltSenseButtonsProps {
  recipeId: string;
  stepIndex: number;
  dimension?: SeasoningDimension;
  label?: string;
  className?: string;
}

const DIMENSION_CONFIG: Record<SeasoningDimension, { emoji: string; label: string }> = {
  [SeasoningDimension.SALT]: { emoji: '🧂', label: 'Salt' },
  [SeasoningDimension.HEAT]: { emoji: '🌶️', label: 'Spice' },
  [SeasoningDimension.ACID]: { emoji: '🍋', label: 'Acid' },
  [SeasoningDimension.SWEET]: { emoji: '🍯', label: 'Sweet' },
  [SeasoningDimension.UMAMI]: { emoji: '🍄', label: 'Umami' },
  [SeasoningDimension.BITTER]: { emoji: '🥬', label: 'Bitter' },
};

export function SaltSenseButtons({
  recipeId,
  stepIndex,
  dimension = SeasoningDimension.SALT,
  label,
  className,
}: SaltSenseButtonsProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<SeasoningLevel | null>(null);
  const [showThanks, setShowThanks] = useState(false);
  const recordFeedback = useRecordSeasoningFeedback();

  const config = DIMENSION_CONFIG[dimension];
  const displayLabel = label || `How's the ${config.label.toLowerCase()}?`;

  const handleFeedback = async (feedback: SeasoningLevel) => {
    setSelectedFeedback(feedback);

    try {
      await recordFeedback.mutateAsync({
        recipeId,
        stepIndex,
        dimension,
        feedback,
      });
      setShowThanks(true);
      setTimeout(() => setShowThanks(false), 2000);
    } catch (error) {
      console.error('Failed to record feedback:', error);
      setSelectedFeedback(null);
    }
  };

  if (showThanks) {
    return (
      <div className={cn('flex items-center gap-2 text-green-600', className)}>
        <Check className="w-5 h-5" />
        <span className="text-sm font-medium">Thanks! Your taste profile updated.</span>
      </div>
    );
  }

  return (
    <div className={cn('bg-cream-50 rounded-xl p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{config.emoji}</span>
        <span className="text-sm font-medium text-neutral-700">{displayLabel}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleFeedback(SeasoningLevel.TOO_LITTLE)}
          disabled={recordFeedback.isPending}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 transition-all',
            'text-sm font-medium',
            selectedFeedback === SeasoningLevel.TOO_LITTLE
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
          )}
        >
          <ThumbsDown className="w-4 h-4" />
          Less
        </button>

        <button
          onClick={() => handleFeedback(SeasoningLevel.PERFECT)}
          disabled={recordFeedback.isPending}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 transition-all',
            'text-sm font-medium',
            selectedFeedback === SeasoningLevel.PERFECT
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
          )}
        >
          <Check className="w-4 h-4" />
          Perfect
        </button>

        <button
          onClick={() => handleFeedback(SeasoningLevel.TOO_MUCH)}
          disabled={recordFeedback.isPending}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 transition-all',
            'text-sm font-medium',
            selectedFeedback === SeasoningLevel.TOO_MUCH
              ? 'border-amber-500 bg-amber-50 text-amber-700'
              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
          )}
        >
          <ThumbsUp className="w-4 h-4" />
          More
        </button>
      </div>
    </div>
  );
}

// Helper to detect if a step mentions seasoning
export function stepMentionsSeasoning(instruction: string): SeasoningDimension | null {
  const text = instruction.toLowerCase();

  // Salt detection
  if (text.includes('salt') || text.includes('season') || text.includes('kosher')) {
    return SeasoningDimension.SALT;
  }

  // Heat detection
  if (
    text.includes('pepper') ||
    text.includes('chili') ||
    text.includes('spicy') ||
    text.includes('cayenne') ||
    text.includes('jalapen') ||
    text.includes('hot sauce')
  ) {
    return SeasoningDimension.HEAT;
  }

  // Acid detection
  if (
    text.includes('lemon') ||
    text.includes('lime') ||
    text.includes('vinegar') ||
    text.includes('citrus') ||
    text.includes('acid')
  ) {
    return SeasoningDimension.ACID;
  }

  // Sweet detection
  if (
    text.includes('sugar') ||
    text.includes('honey') ||
    text.includes('maple') ||
    text.includes('sweet')
  ) {
    return SeasoningDimension.SWEET;
  }

  // Umami detection
  if (
    text.includes('soy sauce') ||
    text.includes('fish sauce') ||
    text.includes('miso') ||
    text.includes('worcestershire') ||
    text.includes('parmesan') ||
    text.includes('mushroom')
  ) {
    return SeasoningDimension.UMAMI;
  }

  return null;
}
