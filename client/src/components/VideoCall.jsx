import React, { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { X, Mic, MicOff, Camera, CameraOff, PhoneOff, PhoneIncoming, PhoneMissed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// Buffer polyfill handled globally via vite.config.js and polyfills.js

export default function VideoCall({ recipientId, isCaller, onClose, incomingSignal, autoAnswer }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { t } = useTranslation();
  
  
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [status, setStatus] = useState(isCaller ? t('videoCall.calling') : t('videoCall.incomingTitle'));

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // Get media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => {
        console.error('Failed to get media stream:', err);
        setStatus(t('videoCall.failed'));
      });

    return () => {
      // Clean up cleanup
       if (stream) {
         stream.getTracks().forEach(track => track.stop());
       }
    }
  }, []);

  // Handle Outgoing Call
  useEffect(() => {
    if (isCaller && stream && socket) {
      console.log('Initiating call to', recipientId);
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: stream
      });

      peer.on('signal', (data) => {
        socket.emit('call:offer', { offer: data, to: recipientId });
      });

      peer.on('stream', (currentStream) => {
        console.log('Received remote stream');
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      });

      socket.on('call:answered', (signal) => {
        setCallAccepted(true);
        setStatus(t('videoCall.connected'));
        peer.signal(signal.answer);
      });
      
      socket.on('call:rejected', () => {
         setStatus(t('videoCall.reject'));
         setTimeout(onClose, 2000);
      });
      
      socket.on('call:ended', () => {
          setCallEnded(true);
          connectionRef.current?.destroy();
          onClose();
      });

      connectionRef.current = peer;
    }
    
    return () => {
        socket?.off('call:answered');
        socket?.off('call:rejected');
        socket?.off('call:ended');
    }
  }, [isCaller, stream, recipientId, socket]);

  // Handle Incoming Call Response
  const answerCall = () => {
    setCallAccepted(true);
    setStatus(t('videoCall.connected'));
    
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (data) => {
      socket.emit('call:answer', { answer: data, to: incomingSignal.from });
    });

    peer.on('stream', (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(incomingSignal.offer);
    
    socket.on('call:ended', () => {
        setCallEnded(true);
        connectionRef.current?.destroy();
        onClose();
    });

    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
       connectionRef.current.destroy();
    }
    socket.emit('call:end', { to: isCaller ? recipientId : incomingSignal?.from });
    onClose();
  };

  const toggleMute = () => {
     if(stream) {
         stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
         setIsMuted(!stream.getAudioTracks()[0].enabled);
     }
  }

  const toggleVideo = () => {
      if(stream) {
          stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
          setIsVideoOff(!stream.getVideoTracks()[0].enabled);
      }
  }

  // Auto-answer logic
  const autoAnsweredRef = useRef(false);
  useEffect(() => {
    if (autoAnswer && stream && !callAccepted && !autoAnsweredRef.current) {
        autoAnsweredRef.current = true;
        answerCall();
    }
  }, [autoAnswer, stream, callAccepted]);

  // Render Incoming Call Request first
  if (!isCaller && !callAccepted) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <PhoneIncoming className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('videoCall.incomingTitle')}</h3>
                <p className="text-gray-500 mb-8">{t('videoCall.incomingDesc')}</p>
                
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => { socket.emit('call:reject', { to: incomingSignal.from }); onClose(); }}
                        className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                    >
                        <PhoneMissed className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={answerCall}
                        className="p-4 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg animate-bounce"
                    >
                        <PhoneIncoming className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 text-white">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
           <div className="bg-black/40 px-3 py-1 rounded-full backdrop-blur-md text-sm font-medium">
             {status}
           </div>
           <button onClick={leaveCall} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition text-white">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Video Grid */}
        <div className="flex-1 grid md:grid-cols-2 gap-4 p-4 relative overflow-hidden bg-gray-900">
           {/* Remote Video */}
           <div className="relative w-full h-full bg-gray-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group">
              {callAccepted && !callEnded ? (
                <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-8">
                   <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CameraOff className="w-8 h-8 text-gray-400" />
                   </div>
                   <p className="text-gray-400 font-medium">{t('videoCall.waitingVideo')}</p>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                 {t('videoCall.remoteUser')}
              </div>
           </div>

           {/* My Video */}
           <div className="relative w-full h-full md:absolute md:bottom-8 md:right-8 md:w-48 md:h-36 md:shadow-2xl md:bg-black rounded-xl overflow-hidden border-2 border-white/10 z-20 transition-all hover:scale-105">
              {stream && (
                 <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover transform scale-x-[-1]" />
              )}
               <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-sm">
                 {t('videoCall.you')}
              </div>
           </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl z-30">
          <button 
             onClick={toggleMute}
             className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700/80 hover:bg-gray-600 text-white'}`}
          >
             {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button 
             onClick={leaveCall}
             className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transform hover:scale-110 transition-all"
          >
             <PhoneOff className="w-6 h-6" />
          </button>

          <button 
             onClick={toggleVideo}
             className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700/80 hover:bg-gray-600 text-white'}`}
          >
             {isVideoOff ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
