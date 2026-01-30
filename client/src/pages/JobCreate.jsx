import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Sparkles, Save, ArrowRight, Loader2, AlertCircle, CheckCircle2, Video } from 'lucide-react';
import clsx from 'clsx';

export default function JobCreate() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('Bathroom renovation: fix leak, retile floor, check wiring.');
  const [language, setLanguage] = useState('en');
  const [assistant, setAssistant] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    skillsRequired: '',
    tasks: '',
    hoursEstimate: '',
    budgetMin: '',
    budgetMax: '',
    urgency: 'medium',
    workersNeeded: 1,
    lat: '',
    lng: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const runAssistant = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/ai/job-assistant', { description, language, audience: 'customer', context: {} });
      setAssistant(res.data);
      const structured = res.data.structured || {};
      setForm(f => ({
        ...f,
        title: structured.title || f.title,
        category: structured.category || f.category,
        skillsRequired: (structured.skills_required || []).join(', '),
        tasks: (structured.tasks || []).join('\n'),
        hoursEstimate: structured.hours_estimate || f.hoursEstimate,
        budgetMin: structured.budget?.min || f.budgetMin,
        budgetMax: structured.budget?.max || f.budgetMax,
        urgency: structured.urgency || f.urgency
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Assistant failed');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let problemVideoUrl = null;
      if (videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('file', videoFile);
        const videoRes = await api.post('/api/uploads/video', videoFormData);
        problemVideoUrl = videoRes.data.url;
      }

      const payload = {
        title: form.title,
        category: form.category,
        description,
        skillsRequired: form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
        tasks: form.tasks.split('\n').map(t => t.trim()).filter(Boolean),
        location: {
          type: 'Point',
          coordinates: [Number(form.lng) || 0, Number(form.lat) || 0]
        },
        budget: {
          min: Number(form.budgetMin) || 0,
          max: Number(form.budgetMax) || 0,
          currency: 'INR'
        },
        schedule: {
          hoursEstimate: Number(form.hoursEstimate) || 0
        },
        urgency: form.urgency,
        workersNeeded: Number(form.workersNeeded) || 1,
        problemVideoUrl
      };
      await api.post('/api/jobs', payload);
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
        <p className="text-gray-500 mt-1">Describe your needs and let our AI help you structure the job post.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: AI Assistant */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-sm border border-primary-100 p-6">
            <div className="flex items-center gap-2 mb-4 text-primary-700">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-semibold">AI Job Assistant</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe the job in plain language
                </label>
                <textarea
                  rows={6}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. I need a plumber to fix a leaking faucet in the kitchen..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              <button
                type="button"
                onClick={runAssistant}
                disabled={loading}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm transition-all hover:shadow-md disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="-ml-1 mr-2 h-4 w-4" />
                    Analyze & Auto-fill
                  </>
                )}
              </button>
            </div>

            {assistant && (
              <div className="mt-6 pt-6 border-t border-primary-100">
                <div className="flex items-start gap-2 text-sm text-primary-800 bg-primary-50 p-3 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-primary-600" />
                  <p>{assistant.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Job Form */}
        <div className="lg:col-span-2">
          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Problem Video (Optional)</label>
                <div className={`
                  mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors
                  ${videoFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
                `}>
                  <div className="space-y-1 text-center">
                    {videoFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Video className="h-8 w-8 text-green-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{videoFile.name}</p>
                          <button 
                            type="button" 
                            onClick={() => setVideoFile(null)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove video
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Video className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="video-upload" className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                            <span>Upload a video</span>
                            <input id="video-upload" name="video-upload" type="file" accept="video/*" className="sr-only" onChange={e => setVideoFile(e.target.files[0])} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">MP4, MOV up to 50MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  required
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select
                  value={form.urgency}
                  onChange={e => setForm({ ...form, urgency: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma separated)</label>
                <input
                  type="text"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={form.skillsRequired}
                  onChange={e => setForm({ ...form, skillsRequired: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasks List (one per line)</label>
                <textarea
                  rows={4}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={form.tasks}
                  onChange={e => setForm({ ...form, tasks: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Min (₹)</label>
                <input
                  type="number"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={form.budgetMin}
                  onChange={e => setForm({ ...form, budgetMin: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Max (₹)</label>
                <input
                  type="number"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={form.budgetMax}
                  onChange={e => setForm({ ...form, budgetMax: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
                <input
                  type="number"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={form.hoursEstimate}
                  onChange={e => setForm({ ...form, hoursEstimate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workers Needed</label>
                <input
                  type="number"
                  min="1"
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={form.workersNeeded}
                  onChange={e => setForm({ ...form, workersNeeded: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70"
              >
                {submitting ? (
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                ) : (
                  <Save className="-ml-1 mr-2 h-4 w-4" />
                )}
                Post Job
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
