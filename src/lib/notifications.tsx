/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './auth';
import type { NotificationItem } from './types';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead as dbMarkRead,
  markNotificationAsUnread as dbMarkUnread,
  markAllNotificationsAsRead as dbMarkAllRead,
  deleteNotification as dbDeleteNotif,
} from './data';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null,
  refresh: async () => {},
  markAsRead: async () => {},
  markAsUnread: async () => {},
  markAllAsRead: async () => {},
  deleteItem: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const [list, count] = await Promise.all([
        fetchNotifications(user.id),
        fetchUnreadNotificationCount(user.id),
      ]);
      setNotifications(list);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      console.error('[WorkZen] Failed to load notifications:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadNotifications();

    function handleEvent() {
      void loadNotifications();
    }

    function handleFocus() {
      void loadNotifications();
    }

    window.addEventListener('workzen:notifications_updated', handleEvent);
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => {
      window.removeEventListener('workzen:notifications_updated', handleEvent);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [loadNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!user) return;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await dbMarkRead(user.id, id);
      } catch (err) {
        console.error('[WorkZen] Failed to mark notification read:', err);
        void loadNotifications();
      }
    },
    [user, loadNotifications]
  );

  const markAsUnread = useCallback(
    async (id: string) => {
      if (!user) return;
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: false } : item))
      );
      setUnreadCount((prev) => prev + 1);

      try {
        await dbMarkUnread(user.id, id);
      } catch (err) {
        console.error('[WorkZen] Failed to mark notification unread:', err);
        void loadNotifications();
      }
    },
    [user, loadNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    // Optimistic update
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    try {
      await dbMarkAllRead(user.id);
    } catch (err) {
      console.error('[WorkZen] Failed to mark all notifications read:', err);
      void loadNotifications();
    }
  }, [user, loadNotifications]);

  const deleteItem = useCallback(
    async (id: string) => {
      if (!user) return;
      const target = notifications.find((n) => n.id === id);
      // Optimistic update
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await dbDeleteNotif(user.id, id);
      } catch (err) {
        console.error('[WorkZen] Failed to delete notification:', err);
        void loadNotifications();
      }
    },
    [user, notifications, loadNotifications]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refresh: loadNotifications,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteItem,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
