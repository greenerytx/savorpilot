import { useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { useRecordSeasoningFeedback } from '../../hooks';
import { SeasoningDimension, SeasoningLevel } from '../../services/flavor-dna.service';
import { cn } from '../../lib/utils';

interface SeasoningFeedbackProps {
  recipeId: string;
  stepIndex: number;
  dimensions?: SeasoningDimension[];
  compact?: boolean;
  onFeedbackGiven?: () => void;
}

const DIMENSION_CONFIG: Record<SeasoningDimension, { emoji: string; label: string; color: string }> = {
  [SeasoningDimension.SALT]: { emoji: '🧂', label: 'Salt', color: 'bg-slate-100' },
  [SeasoningDimension.HEAT]: { emoji: '🌶️', label: 'Heat', color: 'bg-red-50' },
  [SeasoningDimension.ACID]: { emoji: '🍋', label: 'Acid', color: 'bg-yellow-50' },
  [SeasoningDimension.SWEET]: { emoji: '🍯', label: 'Sweet', color: 'bg-amber-50' },
  [SeasoningDimension.UMAMI]: { emoji: '🍄', label: 'Umami', color: 'bg-orange-50' },
  [SeasoningDimension.BITTER]: { emoji: '🥬', label: 'Bitter', color: 'bg-green-50' },
};

const FEEDBACK_OPTIONS = [
  { level: SeasoningLevel.TOO_LITTLE, icon: Minus, label: 'Too little', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
  { level: SeasoningLevel.PERFECT, icon: Check, label: 'Perfect', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
  { level: SeasoningLevel.TOO_MUCH, icon: Plus, label: 'Too much', color: 'text-red-600 bg-red-50 hover:bg-red-100' },
];

export function SeasoningFeedback({
  recipeId,
  stepIndex,
  dimensions = [SeasoningDimension.SALT],
  compact = false,
  onFeedbackGiven,
}: SeasoningFeedbackProps) {
  const [recordedDimensions, setRecordedDimensions] = useState<Set<SeasoningDimension>>(new Set());
  const [activeDimension, setActiveDimension] = useState<SeasoningDimension | null>(
    dimensions.length === 1 ? dimensions[0] : null
  );

  const recordFeedback = useRecordSeasoningFeedback();

  const handleFeedback = async (dimension: SeasoningDimension, feedback: SeasoningLevel) => {
    try {
      await recordFeedback.mutateAsync({
        recipeId,
        stepIndex,
        dimension,
        feedback,
      });

      setRecordedDimensions((prev) => new Set([...prev, dimension]));
      setActiveDimension(null);
      onFeedbackGiven?.();
    } catch (error) {
      console.error('Failed to record seasoning feedback:', error);
    }
  };

  // If all dimensions are recorded, show thank you message
  if (dimensions.every((d) => recordedDimensions.has(d))) {
    return (
      <div className={cn(
        'flex items-center gap-2 text-green-600 text-sm',
        compact ? 'p-2' : 'p-3 bg-green-50 rounded-lg'
      )}>
        <Check className="w-4 h-4" />
        <span>Thanks for the feedback!</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg">
        <span className="text-xs text-neutral-500">Taste check:</span>
        {dimensions.map((dim) => {
          const config = DIMENSION_CONFIG[dim];
          const isRecorded = recordedDimensions.has(dim);
          const isActive = activeDimension === dim;

          if (isRecorded) {
            return (
              <span key={dim} className="text-green-500 text-sm" title={`${config.label} recorded`}>
                {config.emoji}✓
              </span>
            );
          }

          if (isActive) {
            return (
              <div key={dim} className="flex items-center gap-1">
                {FEEDBACK_OPTIONS.map((opt) => (
                  <button
                    key={opt.level}
                    onClick={() => handleFeedback(dim, opt.level)}
                    disabled={recordFeedback.isPending}
                    className={cn(
                      'p-1 rounded transition-colors',
                      opt.color
                    )}
                    title={opt.label}
                  >
                    <opt.icon className="w-3 h-3" />
                  </button>
                ))}
              </div>
            );
          }

          return (
            <button
              key={dim}
              onClick={() => setActiveDimension(dim)}
              className={cn(
                'text-lg hover:scale-110 transition-transform',
                config.color,
                'rounded px-1'
              )}
              title={`Rate ${config.label.toLowerCase()}`}
            >
              {config.emoji}
            </button>
          );
        })}
      </div>
    );
  }

  // Full size version
  return (
    <div className="p-4 bg-gradient-to-r from-primary-50 to-amber-50 rounded-xl border border-primary-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">👅</span>
        <span className="font-medium text-neutral-800">How's the seasoning?</span>
      </div>

      <div className="space-y-3">
        {dimensions.map((dim) => {
          const config = DIMENSION_CONFIG[dim];
          const isRecorded = recordedDimensions.has(dim);

          if (isRecorded) {
            return (
              <div
                key={dim}
                className="flex items-center gap-2 text-green-600 text-sm p-2 bg-green-50 rounded-lg"
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
                <Check className="w-4 h-4 ml-auto" />
              </div>
            );
          }

          return (
            <div key={dim} className="flex items-center gap-3">
              <div className={cn('flex items-center gap-2 min-w-[80px]', config.color, 'rounded-lg px-2 py-1')}>
                <span className="text-lg">{config.emoji}</span>
                <span className="text-sm font-medium text-neutral-700">{config.label}</span>
              </div>

              <div className="flex gap-2 flex-1">
                {FEEDBACK_OPTIONS.map((opt) => (
                  <button
                    key={opt.level}
                    onClick={() => handleFeedback(dim, opt.level)}
                    disabled={recordFeedback.isPending}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all',
                      'border-2 border-transparent',
                      opt.color,
                      'hover:border-current',
                      recordFeedback.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <opt.icon className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Detects if a step instruction likely involves seasoning
 */
export function detectSeasoningStep(instruction: string): SeasoningDimension[] {
  const detected: SeasoningDimension[] = [];
  const lowerInstruction = instruction.toLowerCase();

  // Salt detection
  if (/\b(salt|season|seasoning|salted)\b/.test(lowerInstruction)) {
    detected.push(SeasoningDimension.SALT);
  }

  // Heat/Spice detection
  if (/\b(spice|spicy|heat|pepper|chili|chilli|cayenne|hot sauce|sriracha)\b/.test(lowerInstruction)) {
    detected.push(SeasoningDimension.HEAT);
  }

  // Acid detection
  if (/\b(lemon|lime|vinegar|acid|citrus|orange juice|sour)\b/.test(lowerInstruction)) {
    detected.push(SeasoningDimension.ACID);
  }

  // Sweet detection
  if (/\b(sugar|honey|maple|sweet|syrup|agave)\b/.test(lowerInstruction)) {
    detected.push(SeasoningDimension.SWEET);
  }

  // Umami detection
  if (/\b(soy sauce|fish sauce|miso|worcestershire|umami|msg|parmesan|anchov)\b/.test(lowerInstruction)) {
    detected.push(SeasoningDimension.UMAMI);
  }

  return detected;
}
