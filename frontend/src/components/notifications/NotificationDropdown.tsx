import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NotificationItem } from './NotificationItem';
import { ActiveJobItem } from './ActiveJobItem';
import { YouTubeJobItem } from './YouTubeJobItem';
import {
  useNotifications,
  useNotificationCount,
  useMarkNotificationsAsRead,
  useDeleteAllReadNotifications,
} from '../../hooks/useNotifications';
import { useBackgroundJobs } from '../../contexts/BackgroundJobsContext';

export function NotificationDropdown() {
  const { t } = useTranslation('notifications');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications, isLoading } = useNotifications();
  const { data: count } = useNotificationCount();
  const markAllAsRead = useMarkNotificationsAsRead();
  const deleteAllRead = useDeleteAllReadNotifications();
  const { backgroundJobs, hasActiveJobs, dismissBackgroundJob } = useBackgroundJobs();

  const unreadCount = count?.unread ?? 0;
  const totalBadgeCount = unreadCount + backgroundJobs.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate({ all: true });
  };

  const handleDeleteAllRead = () => {
    deleteAllRead.mutate();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-xl transition-colors',
          isOpen ? 'bg-white shadow-sm' : 'hover:bg-white/50'
        )}
        aria-label={t('title')}
      >
        <Bell className={cn("w-5 h-5", hasActiveJobs ? "text-primary-600" : "text-neutral-600")} />
        {totalBadgeCount > 0 && (
          <span className={cn(
            "absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full",
            hasActiveJobs ? "bg-primary-500 animate-pulse" : "bg-primary-500"
          )}>
            {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <h3 className="font-semibold text-neutral-900">{t('title')}</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsRead.isPending}
                  className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title={t('actions.markAllRead')}
                >
                  {markAllAsRead.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              )}
              {notifications && notifications.some((n) => n.isRead) && (
                <button
                  onClick={handleDeleteAllRead}
                  disabled={deleteAllRead.isPending}
                  className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={t('actions.deleteRead')}
                >
                  {deleteAllRead.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {/* Active Background Jobs */}
            {backgroundJobs.length > 0 && (
              <div className="p-2 border-b border-neutral-100">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide px-2 mb-2">
                  {hasActiveJobs ? t('status.inProgress') : t('status.recentActivity')}
                </p>
                <div className="space-y-2">
                  {backgroundJobs.map((job) => (
                    job.type === 'youtube' ? (
                      <YouTubeJobItem key={job.id} job={job} onDismiss={dismissBackgroundJob} />
                    ) : (
                      <ActiveJobItem key={job.id} job={job} onDismiss={dismissBackgroundJob} />
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Regular Notifications */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="p-2 space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            ) : !hasActiveJobs ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="p-3 bg-neutral-100 rounded-full mb-3">
                  <Bell className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500 text-center">
                  {t('empty.title')}
                </p>
                <p className="text-xs text-neutral-400 text-center mt-1">
                  {t('empty.description')}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
