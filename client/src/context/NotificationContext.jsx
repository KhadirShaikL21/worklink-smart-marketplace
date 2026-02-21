import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
            onClick={() => {
              toast.dismiss(t.id);
              if (note.link) {
                navigate(note.link);
              }
            }}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5 text-2xl">
                  🔔
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {note.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {note.body}
                  </p>
                  {note.link && (
                     <span className="mt-2 text-xs font-semibold text-primary-600 block">
                       Click to view details
                     </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 5000 });
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
