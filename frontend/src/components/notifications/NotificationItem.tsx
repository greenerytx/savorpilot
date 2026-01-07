import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Share2, FolderOpen, Upload, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { type AppNotification, NotificationType } from '../../types/notifications';
import { useMarkSingleNotificationAsRead, useDeleteNotification } from '../../hooks/useNotifications';

interface NotificationItemProps {
  notification: AppNotification;
  onClose: () => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.RECIPE_SHARED:
      return <Share2 className="w-4 h-4" />;
    case NotificationType.GROUP_SHARED:
      return <FolderOpen className="w-4 h-4" />;
    case NotificationType.IMPORT_COMPLETE:
      return <Upload className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
}

function getIconBgColor(type: NotificationType) {
  switch (type) {
    case NotificationType.RECIPE_SHARED:
      return 'bg-blue-100 text-blue-600';
    case NotificationType.GROUP_SHARED:
      return 'bg-purple-100 text-purple-600';
    case NotificationType.IMPORT_COMPLETE:
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

function useFormatTimeAgo() {
  const { t } = useTranslation('notifications');

  return (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t('time.justNow');
    if (seconds < 3600) return t('time.minutesAgo', { count: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('time.hoursAgo', { count: Math.floor(seconds / 3600) });
    if (seconds < 604800) return t('time.daysAgo', { count: Math.floor(seconds / 86400) });
    return date.toLocaleDateString();
  };
}

export const NotificationItem = memo(function NotificationItem({
  notification,
  onClose,
}: NotificationItemProps) {
  const { t } = useTranslation('notifications');
  const navigate = useNavigate();
  const markAsRead = useMarkSingleNotificationAsRead();
  const deleteNotification = useDeleteNotification();
  const formatTimeAgo = useFormatTimeAgo();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Navigate based on notification type
    if (notification.data?.recipeId) {
      navigate(`/recipes/${notification.data.recipeId}`);
      onClose();
    } else if (notification.data?.groupId) {
      navigate(`/collections/${notification.data.groupId}`);
      onClose();
    } else if (notification.type === NotificationType.IMPORT_COMPLETE) {
      navigate('/recipes');
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification.mutate(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex items-start gap-3 p-3 cursor-pointer transition-colors rounded-lg',
        notification.isRead
          ? 'hover:bg-neutral-50'
          : 'bg-primary-50/50 hover:bg-primary-50'
      )}
    >
      <div className={cn('p-2 rounded-lg shrink-0', getIconBgColor(notification.type))}>
        {getNotificationIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm',
          notification.isRead ? 'text-neutral-600' : 'text-neutral-900 font-medium'
        )}>
          {notification.message}
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 rounded transition-all"
        title={t('actions.delete')}
      >
        <X className="w-3.5 h-3.5 text-neutral-500" />
      </button>

      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
      )}
    </div>
  );
});
