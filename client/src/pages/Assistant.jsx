import { useState } from 'react';
import api from '../utils/api';
import { Sparkles, Send, Loader2, Globe, User, FileText, CheckCircle2, Clock, IndianRupee, Hammer } from 'lucide-react';
import clsx from 'clsx';

export default function Assistant() {
  const [description, setDescription] = useState('Fix leaking bathroom tap and check water heater.');
  const [language, setLanguage] = useState('en');
  const [audience, setAudience] = useState('customer');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    const isRaw = typeof data === 'string';
    const job = isRaw ? null : data;

    if (isRaw) return <div className="p-4 whitespace-pre-wrap text-sm text-gray-700">{data}</div>;

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
               job.urgency === 'emergency' ? "bg-red-100 text-red-700" :
               job.urgency === 'high' ? "bg-orange-100 text-orange-700" :
               "bg-green-100 text-green-700"
             )}>
               {job.urgency || 'Standard'}
             </span>
          </div>
        </div>

        {/* Worker Brief or Summary */}
        {(job.worker_brief?.job_summary) && (
          <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
            <h4 className="text-sm font-semibold text-primary-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Summary
            </h4>
            <p className="text-sm text-primary-800 leading-relaxed">{job.worker_brief.job_summary}</p>
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
            <ul className="space-y-2">
              {job.tasks?.map((task, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  {task}
                </li>
              ))}
            </ul>
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
                 <p className="font-semibold text-gray-900">₹{job.budget.min} - ₹{job.budget.max}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the job
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 resize-none"
                placeholder="e.g., I need someone to paint my living room walls..."
                required
              />
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
            <div className="flex-1 overflow-auto rounded-lg">
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
