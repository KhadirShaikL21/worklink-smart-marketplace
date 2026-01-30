import { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Send, MessageSquare, User, Mic, Play, Pause, ArrowLeft, Briefcase } from 'lucide-react';
import { ChatSkeleton } from '../components/ui/Skeleton.jsx';
import clsx from 'clsx';

export default function Chat() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadRooms = async () => {
    try {
      const res = await api.get('/api/chat/rooms');
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms', err);
    }
  };

  const loadMessages = async (roomId) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/chat?roomId=${roomId}`);
      setMessages(res.data.messages || []);
      scrollToBottom();
      setShowMobileChat(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      loadMessages(activeRoom._id);
    }
  }, [activeRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handler = msg => {
      if (!activeRoom) return;
      // Check if message belongs to current room
      if (msg.room === activeRoom._id) {
        setMessages(prev => [msg, ...prev]);
      }
    };
    socket.on('chat:message', handler);
    return () => socket.off('chat:message', handler);
  }, [socket, activeRoom]);

  const send = async e => {
    e.preventDefault();
    if (!activeRoom || !body) return;
    try {
      await api.post('/api/chat', { roomId: activeRoom._id, body, type: 'text' });
      setBody('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  // Helper to format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoomName = (room) => {
    if (room.type === 'group') {
      return room.job?.title || 'Group Chat';
    }
    // For direct chat, find the other participant
    const other = room.participants.find(p => p._id !== user.id);
    return other?.name || 'Unknown User';
  };

  const getRoomAvatar = (room) => {
    if (room.type === 'group') {
      return <Briefcase className="w-5 h-5" />;
    }
    const other = room.participants.find(p => p._id !== user.id);
    return other?.avatarUrl ? (
      <img src={other.avatarUrl} alt={other.name} className="w-full h-full object-cover" />
    ) : (
      <User className="w-5 h-5" />
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-5rem)]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col md:flex-row">
        
        {/* Sidebar / Room Selection */}
        <div className={clsx(
          "w-full md:w-80 border-r border-gray-200 bg-gray-50 flex flex-col",
          showMobileChat ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary-600" />
              Messages
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No active conversations.
              </div>
            ) : (
              rooms.map(room => (
                <button
                  key={room._id}
                  onClick={() => setActiveRoom(room)}
                  className={clsx(
                    "w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left border-b border-gray-100",
                    activeRoom?._id === room._id ? "bg-white border-l-4 border-l-primary-600 shadow-sm" : "border-l-4 border-l-transparent"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold overflow-hidden flex-shrink-0">
                    {getRoomAvatar(room)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{getRoomName(room)}</h3>
                    <p className="text-xs text-gray-500 truncate">
                      {room.job?.title}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={clsx(
          "flex-1 flex-col bg-white",
          showMobileChat ? "flex" : "hidden md:flex"
        )}>
          {activeRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white shadow-sm z-10">
                <button 
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold overflow-hidden">
                  {getRoomAvatar(activeRoom)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{getRoomName(activeRoom)}</h3>
                  <span className="flex items-center gap-1.5 text-xs text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    {activeRoom.type === 'group' ? `${activeRoom.participants.length} participants` : 'Active now'}
                  </span>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {loading ? (
                  <ChatSkeleton />
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                    <p>No messages yet. Say hello!</p>
                  </div>
                ) : (
                  [...messages].reverse().map((msg, idx) => {
                    const isMe = msg.from === user?.id || msg.from === user?._id;
                    // Find sender name from room participants
                    const sender = activeRoom.participants.find(p => p._id === msg.from);
                    
                    return (
                      <div 
                        key={msg._id || idx} 
                        className={clsx(
                          "flex w-full flex-col",
                          isMe ? "items-end" : "items-start"
                        )}
                      >
                        {!isMe && activeRoom.type === 'group' && (
                          <span className="text-xs text-gray-500 ml-1 mb-1">
                            {sender?.name || 'Unknown'}
                          </span>
                        )}
                        <div className={clsx(
                          "max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                          isMe 
                            ? "bg-primary-600 text-white rounded-br-none" 
                            : "bg-white border border-gray-200 text-gray-900 rounded-bl-none"
                        )}>
                          {msg.type === 'audio' ? (
                            <div className="flex items-center gap-2">
                              <Mic className="w-4 h-4" />
                              <a 
                                href={msg.audioUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline text-sm"
                              >
                                Play Audio Message
                              </a>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{msg.body}</p>
                          )}
                          <div className={clsx(
                            "text-[10px] mt-1 text-right opacity-70",
                            isMe ? "text-primary-100" : "text-gray-400"
                          )}>
                            {formatTime(msg.createdAt || Date.now())}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={send} className="flex gap-2">
                  <input
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border-gray-300 focus:border-primary-500 focus:ring-primary-500 px-4 py-2 shadow-sm"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!body.trim()}
                    className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center w-10 h-10"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
              <p className="text-sm max-w-xs text-center mt-1">
                Choose a chat from the sidebar to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
