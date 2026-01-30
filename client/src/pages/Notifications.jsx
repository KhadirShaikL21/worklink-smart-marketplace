import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext.jsx';
import { Bell, Check, Clock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const { socket } = useSocket();

  const load = async () => {
    try {
      const res = await api.get('/api/notifications');
      setItems(res.data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = note => setItems(prev => [note, ...prev]);
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket]);

  const markRead = async id => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setItems(prev => prev.map(item => 
        item._id === id ? { ...item, read: true } : item
      ));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const markAllRead = async () => {
    // Assuming backend supports this or we loop
    // For now, just UI update if backend doesn't support bulk
    const unread = items.filter(i => !i.read);
    for (const item of unread) {
      await markRead(item._id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Bell className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        </div>
        {items.some(i => !i.read) && (
          <button 
            onClick={markAllRead}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No notifications yet</h3>
            <p className="mt-1 text-gray-500">We'll notify you when something important happens.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map(n => (
              <div 
                key={n._id} 
                className={clsx(
                  "p-4 sm:p-6 transition-colors hover:bg-gray-50 flex gap-4",
                  !n.read ? "bg-blue-50/50" : "bg-white"
                )}
              >
                <div className={clsx(
                  "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                  !n.read ? "bg-primary-500" : "bg-transparent"
                )} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={clsx(
                        "text-base font-medium mb-1",
                        !n.read ? "text-gray-900" : "text-gray-700"
                      )}>
                        {n.title}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      {!n.read && (
                        <button 
                          onClick={() => markRead(n._id)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
