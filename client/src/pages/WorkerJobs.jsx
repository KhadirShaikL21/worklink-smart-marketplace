import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Briefcase, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { JobCardSkeleton } from '../components/ui/Skeleton.jsx';
import clsx from 'clsx';

export default function WorkerJobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active', 'completed'

  useEffect(() => {
    setLoading(true);
    api
      .get('/api/jobs')
      .then(res => setJobs(res.data.jobs))
      .catch(err => setError(err.response?.data?.message || 'Failed to load jobs'))
      .finally(() => setLoading(false));
  }, []);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'active') return job.status === 'assigned' || job.status === 'in_progress';
    if (filter === 'completed') return job.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assigned Jobs</h1>
          <p className="text-gray-500 mt-1">Track your ongoing and completed work</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('active')}
            className={clsx(
              filter === 'active'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            )}
          >
            Active Jobs
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={clsx(
              filter === 'completed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            )}
          >
            Completed Jobs
          </button>
        </nav>
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

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Briefcase className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No {filter} jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'active' ? 'You have no active assignments.' : 'You haven\'t completed any jobs yet.'}
              </p>
            </div>
          ) : (
            filteredJobs.map(job => (
              <Link key={job._id} to={`/jobs/${job._id}`} className="block">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden group">
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {job.title}
                        </h3>
                        <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", getUrgencyColor(job.urgency))}>
                          {job.urgency} Priority
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {job.status}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {job.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                        <span className="text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform flex items-center">
                            View Details
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
