import { useState } from 'react';
import api from '../utils/api';
import { Sparkles, Send, Loader2, Globe, User, FileText } from 'lucide-react';

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
    try {
      const res = await api.post('/api/ai/job-assistant', { description, language, audience, context: {} });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Assistant failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col h-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Result</h2>
          
          {result ? (
            <div className="flex-1 overflow-auto bg-white rounded-lg border border-gray-200 p-4 shadow-inner">
              <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                {JSON.stringify(result.structured || result.raw, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-white/50">
              <Sparkles className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">AI output will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
