import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Sparkles, Send, Loader2, Globe, User, FileText, CheckCircle2, Clock, IndianRupee, Hammer, Mic, MicOff, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import NavigationHeader from '../components/NavigationHeader';

export default function Assistant() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('en');
  const [audience, setAudience] = useState('customer');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Set language based on selection
    const langMap = {
      'en': 'en-IN', 
      'hi': 'hi-IN',
      'te': 'te-IN'
    };
    recognition.lang = langMap[language] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setDescription(prev => prev === 'Fix leaking bathroom tap and check water heater.' ? transcript : prev + ' ' + transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow permission.');
      } else {
        setError('Voice recognition failed. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/api/ai/job-assistant', { description, language, audience, context: {} });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Assistant failed to generate response.');
    } finally {
      setLoading(false);
    }
  };

  const JobPreview = ({ data }) => {
    if (!data) return null;
    let job = data;
    let isRaw = typeof data === 'string';

    // Try parsing if raw string
    if (isRaw) {
      try {
        let clean = data.trim();
        // Remove markdown code blocks if present
        if (clean.startsWith('```json')) {
            clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (clean.startsWith('```')) {
             clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        job = JSON.parse(clean);
        isRaw = false;
      } catch (e) {
        console.warn("Failed to parse AI JSON response:", e);
        // Fallback to displaying raw text if parsing fails
      }
    }

    if (isRaw) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-semibold text-gray-900 mb-2">Raw Output</h3>
           <p className="whitespace-pre-wrap text-gray-600 font-mono text-sm bg-gray-50 p-4 rounded-lg">{job}</p>
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
      >
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
           <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">{job.title || 'Untitled Job'}</h3>
                <div className="flex items-center gap-2 mt-2 text-primary-100 text-sm">
                   <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                      {job.category || 'General'}
                   </span>
                   <span>•</span>
                   <span>{job.location || 'Remote/On-site'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                 <span className={clsx("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/20 backdrop-blur-md border border-white/30 shadow-sm", 
                   job.urgency?.toLowerCase() === 'emergency' ? "text-red-100 bg-red-900/30" :
                   job.urgency?.toLowerCase() === 'high' ? "text-orange-100 bg-orange-900/30" :
                   "text-green-100 bg-green-900/30"
                 )}>
                   {job.urgency || 'Standard'}
                 </span>
              </div>
           </div>
        </div>

        <div className="p-6 space-y-6">
            {/* Worker Brief or Summary */}
            {(job.worker_brief?.job_summary || job.description) && (
            <div className="bg-primary-50/50 p-4 rounded-xl border border-primary-100/50">
                <h4 className="text-sm font-semibold text-primary-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> Summary
                </h4>
                <p className="text-sm text-primary-800 leading-relaxed">{job.worker_brief?.job_summary || job.description}</p>
            </div>
            )}

            {/* Guidance for Customer */}
            {(job.guidance?.posting_tips) && (
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" /> AI Suggestions
                </h4>
                <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside marker:text-amber-400">
                    {job.guidance.posting_tips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-gray-400" /> Tasks
                </h4>
                {job.tasks && job.tasks.length > 0 ? (
                <ul className="space-y-3">
                    {job.tasks.map((task, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                        <span className="leading-relaxed">{task}</span>
                    </li>
                    ))}
                </ul>
                ) : <p className="text-sm text-gray-400 italic">No specific tasks listed</p>}
            </div>
            
            <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Hammer className="w-5 h-5 text-gray-400" /> Requirements
                </h4>
                <div className="flex flex-wrap gap-2">
                {job.skills_required?.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                    {skill}
                    </span>
                ))}
                {job.tools_required?.map((tool, i) => (
                    <span key={i} className="px-3 py-1 bg-white text-gray-500 rounded-lg text-xs font-medium border border-gray-200 border-dashed">
                    {tool}
                    </span>
                ))}
                {(!job.skills_required?.length && !job.tools_required?.length) && 
                    <p className="text-sm text-gray-400 italic">No specific requirements</p>
                }
                </div>
            </div>
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
                {job.budget && (
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                    <div className="p-2 bg-white rounded-full text-green-600 shadow-sm">
                        <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Budget Range</p>
                        <p className="font-bold text-gray-900">₹{job.budget.min || 0} - ₹{job.budget.max || 0}</p>
                    </div>
                    </div>
                )}
                {job.hours_estimate && (
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                    <div className="p-2 bg-white rounded-full text-blue-600 shadow-sm">
                        <Clock className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Est. Duration</p>
                        <p className="font-bold text-gray-900">{job.hours_estimate} hrs</p>
                    </div>
                    </div>
                )}
            </div>
            
            {/* POST JOB BUTTON (Inside Preview) */}
            {audience === 'customer' && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end w-full">
                <button
                onClick={() => navigate('/jobs/new', { state: { jobData: job } })} // Use parsed 'job' object
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all active:scale-95 duration-200"
                >
                <span>Complete & Post Job</span>
                <CheckCircle2 className="w-5 h-5" />
                </button>
            </div>
            )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <NavigationHeader 
          title="AI Job Assistant" 
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: 'AI Assistant' }
          ]}
          showBack={true}
        />
        
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-sm border border-gray-100 mb-6">
            <div className="p-3 bg-primary-50 rounded-xl">
                <Sparkles className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            AI Job Assistant
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Create the perfect job post in seconds. Just tell us what you need done, and our AI will structure it professionally for you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Input Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 ring-1 ring-gray-900/5 p-8 sticky top-8"
          >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    Job Details
                </h2>
                {isListening && <span className="flex items-center gap-2 text-red-600 text-sm font-medium animate-pulse">
                    <span className="w-2 h-2 bg-red-600 rounded-full"/> Recording
                </span>}
            </div>
            
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Describe the job requirement
                </label>
                <div className="relative group">
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={8}
                    className={clsx(
                      "w-full rounded-xl border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none pr-14 text-gray-600 leading-relaxed transition-all duration-200 p-4",
                      "group-hover:border-primary-300",
                      isListening && "ring-2 ring-red-500/20 border-red-500 bg-red-50/10"
                    )}
                    placeholder="E.g., I need a plumber to fix a leaking tap in my kitchen and check the water heater pressure. It's an urgent task..."
                    required
                  />
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={clsx(
                      "absolute right-3 bottom-3 p-3 rounded-xl transition-all duration-200 shadow-sm border",
                      isListening 
                        ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 animate-pulse" 
                        : "bg-white text-gray-500 border-gray-200 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50"
                    )}
                    title={isListening ? "Stop Recording" : "Start Voice Input"}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>Try being as specific as possible</span>
                    <span>Supports English, Hindi, Telugu</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    Language
                  </label>
                  <div className="relative">
                    <select
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        className="w-full appearance-none rounded-xl border-gray-200 bg-gray-50 py-3 px-4 shadow-sm focus:border-primary-500 focus:ring-primary-500 hover:bg-white transition-colors cursor-pointer"
                    >
                        <option value="en">English (IN)</option>
                        <option value="hi">Hindi</option>
                        <option value="te">Telugu</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Perspective
                  </label>
                   <div className="relative">
                    <select
                        value={audience}
                        onChange={e => setAudience(e.target.value)}
                        className="w-full appearance-none rounded-xl border-gray-200 bg-gray-50 py-3 px-4 shadow-sm focus:border-primary-500 focus:ring-primary-500 hover:bg-white transition-colors cursor-pointer"
                    >
                        <option value="customer">I am hiring</option>
                        <option value="worker">I am working</option>
                    </select>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-start gap-3 border border-red-100"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                    </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/20 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Structure...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Job Post
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Result Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    Preview
                </h2>
                {result && <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">AI Generated</span>}
            </div>
            
            {result ? (
              <div className="flex-1">
                <JobPreview data={result.structured || result.raw} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50 min-h-[500px]">
                <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-6 animate-pulse">
                  <Sparkles className="w-10 h-10 text-primary-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Assist</h3>
                <p className="text-gray-500 max-w-sm">
                   Your structured job post content will appear here after you describe your requirements.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
