import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../utils/api.js';

const SocketContext = createContext({
  socket: null,
  incomingCall: null,
  setIncomingCall: () => {}
});

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    const s = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', {
      auth: { token }
    });
    
    // Global listener for incoming calls
    s.on('call:incoming', (data) => {
       console.log('SocketContext captured incoming call:', data);
       setIncomingCall(data);
    });

    s.on('call:ended', () => {
       setIncomingCall(null);
    });
    
    setSocket(s);
    
    return () => {
      s.off('call:incoming');
      s.off('call:ended');
      s.disconnect();
    };
  }, [user]);

  const value = useMemo(() => ({ socket, incomingCall, setIncomingCall }), [socket, incomingCall]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
     return { socket: null, incomingCall: null, setIncomingCall: () => {} }; 
  }
  return context;
}
