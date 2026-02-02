import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refresh: () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {}
});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setInitialized(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data.notifications || []);
      setInitialized(true);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!socket || !user) return;
    const handleNotification = note => {
      setNotifications(prev => [note, ...prev]);
    };
    socket.on('notification:new', handleNotification);
    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [socket, user]);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    for (const note of unread) {
      // sequential to avoid rate limiting
      // eslint-disable-next-line no-await-in-loop
      await markAsRead(note._id);
    }
  }, [notifications, markAsRead]);

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    loading,
    initialized,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead
  }), [notifications, loading, initialized, loadNotifications, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
