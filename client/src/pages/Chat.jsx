import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Send, MessageSquare, User, Mic, Play, Pause, ArrowLeft, Briefcase, Trash2, StopCircle, Loader2, Video, Phone } from 'lucide-react';
import VideoCall from '../components/VideoCall.jsx';
import { ChatSkeleton } from '../components/ui/Skeleton.jsx';
import clsx from 'clsx';

// Audio Player Component
const AudioMessage = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleTimeUpdate = () => {
           const p = (audio.currentTime / audio.duration) * 100;
           setProgress(p || 0);
      };

      const handleEnded = () => {
          setIsPlaying(false);
          setProgress(0);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('ended', handleEnded);
      };
  }, []);

  const togglePlay = () => {
      if (audioRef.current.paused) {
          audioRef.current.play();
          setIsPlaying(true);
      } else {
          audioRef.current.pause();
          setIsPlaying(false);
      }
  };

  return (
    <div className="flex items-center gap-3 w-64">
      <button 
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0"
      >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>
      
      <div className="flex-1 flex flex-col gap-1">
          {/* Waveform / Progress Bar */}
          <div className="h-6 flex items-center gap-[2px] w-full overflow-hidden">
             {Array.from({ length: 25 }).map((_, i) => (
                  <div 
                      key={i} 
                      className={clsx(
                          "w-1 rounded-full transition-all duration-300",
                          (i / 25) * 100 < progress 
                              ? "bg-current opacity-100" // Played part
                              : "bg-current opacity-30"  // Unplayed part
                      )}
                      style={{ 
                          height: `${Math.max(30, Math.random() * 100)}%`, // Random height for waveform look
                          animation: isPlaying ? `pulse 1s infinite ${i * 0.05}s` : 'none' 
                      }}
                  />
              ))}
          </div>
      </div>
      <audio ref={audioRef} src={url} className="hidden" />
    </div>
  );
};

export default function Chat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);  
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Video Call State
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const { incomingCall, setIncomingCall } = useSocket();
  const incomingCallSignal = incomingCall;
  const location = useLocation();
  const autoAnswer = location.state?.autoAnswer;

  // Listen for incoming calls via Context
  useEffect(() => {
    if (incomingCall && !isVideoCallOpen) {
       console.log('Incoming call from context:', incomingCall.from);
       setIsCaller(false);
       setIsVideoCallOpen(true);
    }
  }, [incomingCall, isVideoCallOpen]);

  const startVideoCall = () => {
    setIsCaller(true);
    setIsVideoCallOpen(true);
  };

  const closeVideoCall = () => {
    setIsVideoCallOpen(false);
    setIncomingCall(null);
    setIsCaller(false);
  };
  
  const messagesEndRef = useRef(null);

  // Parse query params for roomId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => r._id === roomId);
      if (room) {
        setActiveRoom(room);
        setShowMobileChat(true);
      }
    }
  }, [rooms]);

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

  // --- Voice Note Logic ---

  const visualizeRecording = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isRecording) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw bars
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // Use primary color for bars
        canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`; 
        canvasCtx.fillStyle = '#4f46e5'; // Indigo-600
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Setup Audio Context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleStopRecording;

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start visualization loop
      setTimeout(visualizeRecording, 100);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      if(err.name === 'NotAllowedError'){
        setError('Microphone access denied. Please allow permissions.');
      } else {
        setError('Could not access microphone.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
       mediaRecorderRef.current.onstop = null; // Prevent upload
       mediaRecorderRef.current.stop();
       mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
       setIsRecording(false);
       clearInterval(timerRef.current);
       setRecordingTime(0);
       if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
       if (audioContextRef.current) audioContextRef.current.close();
    }
  };

  const handleStopRecording = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    // Create blob from chunks
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
    
    setIsUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/api/uploads/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const audioUrl = res.data.url;
      
      await api.post('/api/chat', { 
        roomId: activeRoom._id, 
        body: 'Voice Message',
        type: 'audio',
        audioUrl 
      });
      
    } catch (err) {
      console.error('Failed to upload audio', err);
      setError('Failed to send voice note');
    } finally {
      setIsUploadingAudio(false);
      setRecordingTime(0);
    }
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
 
  // END of Chat Component Logic
  
  // Render
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
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm z-10">
                <div className="flex items-center gap-3">
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

                {/* Video Call Button */}
                {/* Available for direct chats or job chats where a worker is assigned (not open bidding phase) */}
                {activeRoom.participants.length > 1 && (!activeRoom.job || activeRoom.job.status !== 'open') && (
                    <button 
                        onClick={startVideoCall}
                        className="p-2 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors shadow-sm"
                        title={t('videoCall.startConsultation')}
                    >
                        <Video className="w-5 h-5" />
                    </button>
                )}
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
                            <AudioMessage url={msg.audioUrl} />
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
                {isRecording ? (
                    <div className="flex items-center gap-3 w-full bg-gray-50 rounded-full px-4 py-2 border border-red-200 animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-bounce" />
                        <span className="text-red-600 font-mono text-sm w-12">{formatDuration(recordingTime)}</span>
                        
                        {/* Visualization Canvas */}
                        <canvas ref={canvasRef} className="flex-1 h-8 rounded" width={200} height={32} />

                        <div className="flex gap-2">
                             <button
                                onClick={cancelRecording}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-600 transition-colors"
                                title="Cancel"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                             <button
                                onClick={stopRecording}
                                className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md transform hover:scale-105 transition-all"
                                title="Send"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={send} className="flex gap-2 items-center">
                    <button
                        type="button"
                        onClick={startRecording}
                        disabled={loading || isUploadingAudio}
                        className={clsx(
                            "p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors",
                            isUploadingAudio ? "opacity-50 cursor-not-allowed" : ""
                        )}
                        title="Record Voice Note"
                    >
                         {isUploadingAudio ? <Loader2 className="w-6 h-6 animate-spin text-primary-600" /> : <Mic className="w-6 h-6" />}
                    </button>
                    
                    <input
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-full border-gray-300 focus:border-primary-500 focus:ring-primary-500 px-4 py-2 shadow-sm"
                        disabled={isUploadingAudio}
                    />
                    <button
                        type="submit"
                        disabled={!body.trim() || isUploadingAudio}
                        className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center w-10 h-10"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                  </button>
                    
                </form>
                )}
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
      
      {/* Video Call Modal */}
      {isVideoCallOpen && (
         <VideoCall
            isCaller={isCaller}
            // If caller, use active room participant. If incoming, recipientId is not strictly needed by component for answering
            recipientId={isCaller ? activeRoom?.participants.find(p => p._id !== user._id)?._id : null}
            incomingSignal={incomingCallSignal}
            onClose={closeVideoCall}
            autoAnswer={autoAnswer}
         />
      )}
    </div>
  );
}
