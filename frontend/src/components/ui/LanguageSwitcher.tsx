import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function LanguageSwitcher({ variant = 'compact', className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const isArabic = currentLang === 'ar';

  const toggleLanguage = () => {
    const newLang = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleLanguage}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          text-sm font-medium text-neutral-600
          bg-white/50 hover:bg-white
          border border-neutral-200 hover:border-neutral-300
          transition-all duration-200
          ${className}
        `}
        aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
      >
        <Globe className="w-4 h-4" />
        <span className="font-semibold">
          {isArabic ? 'EN' : 'ع'}
        </span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${currentLang === 'en'
            ? 'bg-primary-500 text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }
        `}
      >
        English
      </button>
      <button
        onClick={() => i18n.changeLanguage('ar')}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${currentLang === 'ar'
            ? 'bg-primary-500 text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }
        `}
      >
        العربية
      </button>
    </div>
  );
}
