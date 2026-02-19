import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Sparkles, Send, Loader2, Globe, User, FileText, CheckCircle2, Clock, IndianRupee, Hammer, Mic, MicOff } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

export default function Assistant() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('Fix leaking bathroom tap and check water heater.');
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
      'en': 'en-IN', // Use Indian English for better accent recognition
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
      setError(err.response?.data?.message || 'Assistant failed');
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
        // Remove markdown code blocks
        clean = clean.replace(/```json/g, '').replace(/```/g, '');
        
        // Find JSON block: first { and last }
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
          // Sometimes models output extra braces or text after. 
          // We will try to parse from the first { to the last }.
          // If that fails, we can try to walk backwards from end to find the valid JSON end.
          const jsonPotential = clean.substring(firstBrace, lastBrace + 1);
          try {
             job = JSON.parse(jsonPotential);
             isRaw = false;
          } catch(e) {
             // If parsing failed, maybe there are extra closing braces (e.g. "}}")
             // Try removing last character if it is '}'
             if (jsonPotential.endsWith('}}')) {
                const fixed = jsonPotential.slice(0, -1);
                job = JSON.parse(fixed);
                isRaw = false;
             } else {
                throw e;
             }
          }
        }
      } catch (e) {
        // Parsing failed, stick to raw string
        console.warn("JSON Parse failed", e);
        isRaw = true;
      }
    }

    if (isRaw) return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Raw Output (Could not format)</h4>
        <pre className="whitespace-pre-wrap text-xs text-gray-600 font-mono overflow-auto max-h-96">{data}</pre>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{job.title || 'Untitled Job'}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
              {job.category || 'General'}
            </span>
          </div>
          <div className="flex flex-col items-end">
             <span className={clsx("px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide", 
               job.urgency?.toLowerCase() === 'emergency' ? "bg-red-100 text-red-700" :
               job.urgency?.toLowerCase() === 'high' ? "bg-orange-100 text-orange-700" :
               "bg-green-100 text-green-700"
             )}>
               {job.urgency || 'Standard'}
             </span>
          </div>
        </div>

        {/* Worker Brief or Summary */}
        {(job.worker_brief?.job_summary || job.description) && (
          <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
            <h4 className="text-sm font-semibold text-primary-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Summary
            </h4>
            <p className="text-sm text-primary-800 leading-relaxed">{job.worker_brief?.job_summary || job.description}</p>
          </div>
        )}

        {/* Guidance for Customer */}
        {(job.guidance?.posting_tips) && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
             <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                 <Sparkles className="w-4 h-4" /> AI Suggestions
             </h4>
             <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                 {job.guidance.posting_tips.map((tip, i) => <li key={i}>{tip}</li>)}
             </ul>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-500" /> Tasks
            </h4>
            {job.tasks && job.tasks.length > 0 ? (
              <ul className="space-y-2">
                {job.tasks.map((task, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-400 italic">No specific tasks listed</p>}
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Hammer className="w-4 h-4 text-gray-500" /> Requirements
            </h4>
            <div className="flex flex-wrap gap-2">
              {job.skills_required?.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">
                  {skill}
                </span>
              ))}
              {job.tools_required?.map((tool, i) => (
                <span key={i} className="px-3 py-1 bg-gray-50 text-gray-500 rounded-md text-xs font-medium border border-gray-200 dashed">
                  {tool}
                </span>
              ))}
              {(!job.skills_required?.length && !job.tools_required?.length) && 
                <p className="text-sm text-gray-400 italic">No specific requirements</p>
              }
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
           {job.budget && (
             <div className="flex items-center gap-2">
               <div className="p-2 bg-green-50 rounded-full text-green-600">
                 <IndianRupee className="w-4 h-4" />
               </div>
               <div>
                 <p className="text-xs text-gray-500">Estimated Budget</p>
                 <p className="font-semibold text-gray-900">₹{job.budget.min || 0} - ₹{job.budget.max || 0}</p>
               </div>
             </div>
           )}
           {job.hours_estimate && (
             <div className="flex items-center gap-2">
               <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                 <Clock className="w-4 h-4" />
               </div>
               <div>
                 <p className="text-xs text-gray-500">Duration</p>
                 <p className="font-semibold text-gray-900">{job.hours_estimate} hrs</p>
               </div>
             </div>
           )}
        </div>
        
        {/* POST JOB BUTTON (Inside Preview) */}
        {audience === 'customer' && (
          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end w-full">
              <button
              onClick={() => navigate('/jobs/new', { state: { jobData: job } })} // Use parsed 'job' object
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors text-lg"
            >
              <CheckCircle2 className="w-6 h-6" />
              Use This to Create Job
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
          <Sparkles className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Job Posting Assistant</h1>
        <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
          Let our AI help you create the perfect job posting. Just describe what you need, and we'll structure it for you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Job Details
          </h2>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                <span>Describe the job</span>
                {isListening && <span className="text-red-600 animate-pulse text-xs font-semibold">● Recording...</span>}
              </label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={6}
                  className={clsx(
                    "w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none pr-12",
                    isListening && "ring-2 ring-red-500 border-red-500 bg-red-50"
                  )}
                  placeholder="Tap the mic and speak..."
                  required
                />
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={clsx(
                    "absolute right-3 top-3 p-2 rounded-full transition-all shadow-sm",
                    isListening 
                      ? "bg-red-600 text-white hover:bg-red-700 animate-pulse" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  title={isListening ? "Stop Recording" : "Start Voice Input"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Supports English, Hindi, and Telugu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language
                </label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="te">Telugu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Perspective
                </label>
                <select
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="customer">Customer</option>
                  <option value="worker">Worker</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Structured Post
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col h-full min-h-[500px]">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            Generated Result
          </h2>
          
          {result ? (
            <div className="flex-1 overflow-auto rounded-lg flex flex-col">
              <JobPreview data={result.structured || result.raw} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Your structured job post will appear here</p>
              <p className="text-sm text-gray-400 mt-1">Fill in the details and click generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
