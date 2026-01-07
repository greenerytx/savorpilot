import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'sage';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-primary-100 text-primary-600',
    primary: 'bg-coral-100 text-coral-700',
    secondary: 'bg-primary-50 text-primary-600',
    success: 'bg-mint-100 text-mint-700',
    warning: 'bg-butter-100 text-butter-700',
    error: 'bg-coral-100 text-coral-700',
    sage: 'bg-sage-100 text-sage-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1',
        'text-xs font-medium rounded-full',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
