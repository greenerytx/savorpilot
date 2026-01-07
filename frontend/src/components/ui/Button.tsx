import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-xl
      transition-all duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: 'bg-primary-900 text-white hover:bg-primary-800 active:bg-primary-700 focus-visible:ring-primary-500 shadow-lg shadow-primary-900/20',
      secondary: 'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500',
      outline: 'bg-transparent border border-primary-200 text-primary-700 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500',
      ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 hover:text-coral-600 active:bg-primary-100 focus-visible:ring-primary-500',
      danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500',
    };

    const sizes = {
      sm: 'text-xs px-3 py-2 rounded-lg',
      md: 'text-sm px-4 py-2.5',
      lg: 'text-base px-6 py-3',
      icon: 'p-2.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
