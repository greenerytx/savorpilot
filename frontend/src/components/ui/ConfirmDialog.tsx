import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, AlertCircle, HelpCircle } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'default';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonVariant: 'primary' as const,
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonVariant: 'primary' as const,
  },
  default: {
    icon: HelpCircle,
    iconBg: 'bg-neutral-100',
    iconColor: 'text-neutral-600',
    buttonVariant: 'primary' as const,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');
  const config = variantConfig[variant];
  const resolvedConfirmText = confirmText || t('buttons.confirm');
  const resolvedCancelText = cancelText || t('buttons.cancel');
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    if (!isLoading) onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="flex flex-col items-center text-center">
        <div className={cn('p-3 rounded-full mb-4', config.iconBg)}>
          <Icon className={cn('w-6 h-6', config.iconColor)} />
        </div>

        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
        <p className="text-sm text-neutral-600 mb-6">{message}</p>

        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {resolvedCancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {resolvedConfirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
