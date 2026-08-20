import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Send,
  CheckCheck,
  Trash2,
  Inbox,
  ArrowRight,
  Loader2,
  MailCheck,
  Mail,
} from 'lucide-react';
import { useNotifications } from '@/lib/notifications';
import type { NotificationItem } from '@/lib/types';

const typeConfigs: Record<
  string,
  {
    icon: typeof CheckCircle2;
    iconColor: string;
    iconBg: string;
    badgeLabel: string;
  }
> = {
  application_accepted: {
    icon: CheckCircle2,
    iconColor: 'text-accent-600',
    iconBg: 'bg-accent-50 border-accent-200 text-accent-700',
    badgeLabel: 'Accepted',
  },
  application_rejected: {
    icon: XCircle,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 border-rose-200 text-rose-700',
    badgeLabel: 'Status Update',
  },
  application_submitted: {
    icon: Send,
    iconColor: 'text-brand-600',
    iconBg: 'bg-brand-50 border-brand-200 text-brand-700',
    badgeLabel: 'Submitted',
  },
  interview_scheduled: {
    icon: Calendar,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    badgeLabel: 'Interview',
  },
  interview_rescheduled: {
    icon: Clock,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-200 text-amber-700',
    badgeLabel: 'Rescheduled',
  },
};

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteItem,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  }

  function handleNotificationClick(item: NotificationItem) {
    if (!item.isRead) {
      void markAsRead(item.id);
    }

    if (item.relatedInterviewId) {
      navigate(`/app/interviews/${item.relatedInterviewId}`);
    } else if (item.relatedApplicationId) {
      navigate('/app/applications');
    }
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 border border-brand-200">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Stay updated on application progress, interview schedules, and employer responses.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-soft transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            ) : (
              <CheckCheck className="h-4 w-4 text-brand-600" />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-ink-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`relative pb-3 text-sm font-semibold transition ${
            activeTab === 'all'
              ? 'text-brand-600'
              : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          All Notifications
          <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-600">
            {notifications.length}
          </span>
          {activeTab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`relative pb-3 text-sm font-semibold transition ${
            activeTab === 'unread'
              ? 'text-brand-600'
              : 'text-ink-500 hover:text-ink-900'
          }`}
        >
          Unread
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
              unreadCount > 0
                ? 'bg-brand-100 text-brand-700'
                : 'bg-ink-100 text-ink-600'
            }`}
          >
            {unreadCount}
          </span>
          {activeTab === 'unread' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t" />
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-100">
            {activeTab === 'unread' ? (
              <MailCheck className="h-7 w-7 text-accent-600" />
            ) : (
              <Inbox className="h-7 w-7 text-ink-400" />
            )}
          </div>
          <h3 className="mt-4 text-base font-semibold text-ink-900">
            {activeTab === 'unread'
              ? "You're all caught up!"
              : 'No notifications yet'}
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            {activeTab === 'unread'
              ? 'There are no unread notifications right now.'
              : 'Updates regarding your applications and interviews will appear here.'}
          </p>
          {activeTab === 'unread' && notifications.length > 0 && (
            <button
              onClick={() => setActiveTab('all')}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              View all notifications <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            const config = typeConfigs[item.type] || {
              icon: Bell,
              iconColor: 'text-ink-600',
              iconBg: 'bg-ink-100 border-ink-200 text-ink-700',
              badgeLabel: 'Update',
            };
            const Icon = config.icon;
            const hasLink = Boolean(
              item.relatedInterviewId || item.relatedApplicationId
            );

            return (
              <article
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group relative flex flex-col gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-start ${
                  hasLink ? 'cursor-pointer hover:shadow-card' : ''
                } ${
                  item.isRead
                    ? 'border-ink-200 bg-white hover:border-ink-300'
                    : 'border-brand-200 bg-gradient-to-r from-brand-50/50 via-white to-white shadow-soft hover:border-brand-300'
                }`}
              >
                {/* Unread indicator dot */}
                {!item.isRead && (
                  <span
                    aria-label="Unread"
                    className="absolute left-2.5 top-3 sm:top-6 h-2 w-2 rounded-full bg-brand-600 shadow-sm"
                  />
                )}

                {/* Type icon */}
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${config.iconBg} shadow-sm`}
                >
                  <Icon className={`h-5 w-5 ${config.iconColor}`} />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`text-base font-bold ${
                        item.isRead ? 'text-ink-800' : 'text-ink-950'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border ${config.iconBg}`}
                    >
                      {config.badgeLabel}
                    </span>
                  </div>

                  <p
                    className={`mt-1.5 text-sm leading-relaxed ${
                      item.isRead ? 'text-ink-600' : 'text-ink-800 font-medium'
                    }`}
                  >
                    {item.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-400">
                    <span>{formatTimestamp(item.createdAt)}</span>
                    {hasLink && (
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-600 transition group-hover:translate-x-0.5">
                        {item.relatedInterviewId
                          ? 'View interview details'
                          : 'View applications'}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div
                  className="flex items-center gap-1 self-end sm:self-start shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.isRead ? (
                    <button
                      onClick={() => void markAsUnread(item.id)}
                      title="Mark as unread"
                      aria-label="Mark as unread"
                      className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => void markAsRead(item.id)}
                      title="Mark as read"
                      aria-label="Mark as read"
                      className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => void deleteItem(item.id)}
                    title="Delete notification"
                    aria-label="Delete notification"
                    className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
