import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext.jsx';
import { MessageSquare, X, Send, Sparkles, User, Bot, Loader2, Mic, StopCircle, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

export default function AssistantWidget() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const isWorker = user?.roles?.includes('worker');
  const roleTitle = isWorker ? 'Partner Support' : 'Customer Support';
  
  // Initial greeting
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
       const initialMsg = isWorker 
           ? 'Namaste! I am your Partner Assistant. Ask me about jobs, payments, or safety.'
           : 'Hello! I am your WorkLink Assistant. How can I help you post a job or find a worker?';
       setMessages([{
         role: 'assistant',
         content: initialMsg
       }]);
    }
  }, [isOpen, isWorker]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      // utterance.lang = 'en-US'; // Auto-detects usually
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Voice input not supported in this browser.");
      return;
    }

    if (isListening) {
      // It handles stopping automatically, but force stop if needed
      window.speechRecognitionInstance?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Default to English, could be dynamic
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      // Optional: Auto-send could go here
    };

    recognition.onerror = (event) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    window.speechRecognitionInstance = recognition;
    recognition.start();
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/ai/chat', { message: userMessage.content });
      const reply = res.data?.reply || 'I am sorry, I could not process that.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      // Auto-speak reply if it was a voice interaction context (optional, but requested "reply as voice")
      // For now, let's just make it available via a button to avoid annoyance
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="bg-primary-600 p-4 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">WorkLink AI</h3>
                  <p className="text-xs text-primary-100 font-medium opacity-90">{roleTitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={clsx(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                    msg.role === 'user' ? "bg-primary-100 text-primary-700" : "bg-white border border-gray-200 text-primary-600"
                  )}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={clsx(
                    "p-3 rounded-2xl text-sm leading-relaxed shadow-sm group relative",
                    msg.role === 'user' 
                      ? "bg-primary-600 text-white rounded-tr-none" 
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-none pr-8"
                  )}>
                    {msg.content}
                    {msg.role === 'assistant' && (
                      <button 
                        onClick={() => speak(msg.content)}
                        className="absolute bottom-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-primary-600"
                        title="Read Aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                   <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                     <Bot className="w-5 h-5 text-primary-600" />
                   </div>
                   <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                     <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                     <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                     <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={clsx(
                  "p-2 rounded-full transition-colors flex-shrink-0",
                  isListening ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
                title="Voice Input"
              >
                {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask anything..."}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 shadow-md flex-shrink-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary-600 to-indigo-700 text-white rounded-full shadow-lg hover:shadow-primary-500/30 flex items-center justify-center z-50 transition-all"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-7 h-7" />}
      </motion.button>
    </>
  );
}
