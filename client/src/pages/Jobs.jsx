import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Briefcase, AlertCircle, ChevronRight, Users, Calendar, CheckCircle2, X, TrendingUp } from 'lucide-react';
import { JobCardSkeleton } from '../components/ui/Skeleton.jsx';
import clsx from 'clsx';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  const loadJobs = () => {
    setLoading(true);
    api
      .get('/api/jobs?role=customer')
      .then(res => setJobs(res.data.jobs))
      .catch(err => setError(err.response?.data?.message || 'Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  // Group jobs by status
  const activeJobs = jobs.filter(j => ['open', 'assigned', 'in_progress'].includes(j.status));
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const cancelledJobs = jobs.filter(j => j.status === 'cancelled');

  const tabs = [
    { id: 'active', label: 'Active', icon: TrendingUp, count: activeJobs.length, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, count: completedJobs.length, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'cancelled', label: 'Cancelled', icon: X, count: cancelledJobs.length, color: 'text-gray-600', bgColor: 'bg-gray-50' }
  ];

  const currentJobs = activeTab === 'active' ? activeJobs : activeTab === 'completed' ? completedJobs : cancelledJobs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Posted Jobs</h1>
              <p className="text-gray-600 text-sm mt-1">Manage and track all your job postings</p>
            </div>
            <Link
              to="/jobs/new"
              className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-5 w-5 mr-2" />
              Post New Job
            </Link>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 rounded-full font-semibold transition-all duration-200 whitespace-nowrap',
                    isActive
                      ? `${tab.bgColor} ${tab.color} shadow-md border-2 border-current`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                  <span className={clsx(
                    'ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold',
                    isActive ? 'bg-white opacity-70' : 'bg-gray-300 text-gray-700'
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-semibold">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : currentJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'active' && <Briefcase className="h-12 w-12 text-gray-400" />}
              {activeTab === 'completed' && <CheckCircle2 className="h-12 w-12 text-gray-400" />}
              {activeTab === 'cancelled' && <X className="h-12 w-12 text-gray-400" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-4">
              {activeTab === 'active' && 'No active jobs'}
              {activeTab === 'completed' && 'No completed jobs'}
              {activeTab === 'cancelled' && 'No cancelled jobs'}
            </h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
              {activeTab === 'active' && 'Create a new job posting to get started'}
              {activeTab === 'completed' && 'Your completed jobs will appear here'}
              {activeTab === 'cancelled' && 'Your cancelled jobs will appear here'}
            </p>
            {activeTab === 'active' && (
              <Link
                to="/jobs/new"
                className="inline-flex items-center px-6 py-3 mt-6 text-white font-semibold rounded-full bg-blue-600 hover:bg-blue-700 transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Post First Job
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentJobs.map((job) => (
              <div
                key={job._id}
                className={clsx(
                  'bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] overflow-hidden group',
                  activeTab === 'completed' && 'opacity-75',
                  activeTab === 'cancelled' && 'opacity-60'
                )}
              >
                {/* Status Bar */}
                <div className={clsx(
                  'h-1.5',
                  activeTab === 'active' && 'bg-gradient-to-r from-blue-500 to-blue-600',
                  activeTab === 'completed' && 'bg-gradient-to-r from-green-500 to-green-600',
                  activeTab === 'cancelled' && 'bg-gradient-to-r from-gray-400 to-gray-500'
                )} />

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Left Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={clsx(
                          'h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0',
                          activeTab === 'active' && 'bg-blue-100',
                          activeTab === 'completed' && 'bg-green-100',
                          activeTab === 'cancelled' && 'bg-gray-100'
                        )}>
                          <Briefcase className={clsx(
                            'h-6 w-6',
                            activeTab === 'active' && 'text-blue-600',
                            activeTab === 'completed' && 'text-green-600',
                            activeTab === 'cancelled' && 'text-gray-600'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={clsx(
                            'text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate',
                            activeTab === 'cancelled' && 'line-through'
                          )}>
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{job.category}</p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={clsx(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                          job.urgency === 'high' && 'bg-red-100 text-red-700',
                          job.urgency === 'medium' && 'bg-yellow-100 text-yellow-700',
                          job.urgency === 'low' && 'bg-green-100 text-green-700'
                        )}>
                          {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)} Priority
                        </span>
                        <span className={clsx(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize',
                          activeTab === 'active' && 'bg-blue-100 text-blue-700',
                          activeTab === 'completed' && 'bg-green-100 text-green-700',
                          activeTab === 'cancelled' && 'bg-gray-200 text-gray-700'
                        )}>
                          {activeTab === 'active' && job.status}
                          {activeTab === 'completed' && 'Completed'}
                          {activeTab === 'cancelled' && 'Cancelled'}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                          Posted {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 sm:flex-col sm:items-end">
                      {activeTab === 'active' && (
                        <Link
                          to={`/jobs/${job._id}/matching`}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md text-sm"
                        >
                          <Users className="h-4 w-4" />
                          Find Matches
                        </Link>
                      )}
                      <Link
                        to={`/jobs/${job._id}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                      >
                        View Details
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
