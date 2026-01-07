import { cn } from '../../lib/utils';
import type { UnitDisplaySystem } from '../../stores/unitPreferencesStore';

export interface UnitToggleProps {
  value: UnitDisplaySystem;
  onChange: (system: UnitDisplaySystem) => void;
  showOriginalOption?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const options: { value: UnitDisplaySystem; label: string; shortLabel: string }[] = [
  { value: 'metric', label: 'Metric', shortLabel: 'Metric' },
  { value: 'imperial', label: 'Imperial', shortLabel: 'Imperial' },
  { value: 'original', label: 'Original', shortLabel: 'Orig' },
];

export function UnitToggle({
  value,
  onChange,
  showOriginalOption = true,
  size = 'md',
  className,
}: UnitToggleProps) {
  const displayOptions = showOriginalOption
    ? options
    : options.filter((opt) => opt.value !== 'original');

  const sizeStyles = {
    sm: {
      container: 'p-0.5 gap-0.5',
      button: 'px-2 py-1 text-xs',
    },
    md: {
      container: 'p-1 gap-1',
      button: 'px-3 py-1.5 text-sm',
    },
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg bg-neutral-100',
        sizeStyles[size].container,
        className
      )}
      role="radiogroup"
      aria-label="Unit system selection"
    >
      {displayOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md font-medium transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
            sizeStyles[size].button,
            value === option.value
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          )}
        >
          <span className="hidden sm:inline">{option.label}</span>
          <span className="sm:hidden">{option.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
