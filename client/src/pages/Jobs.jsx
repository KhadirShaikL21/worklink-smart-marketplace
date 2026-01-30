import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Plus, Briefcase, Clock, AlertCircle, ChevronRight, Users, Calendar } from 'lucide-react';
import { JobCardSkeleton } from '../components/ui/Skeleton.jsx';
import clsx from 'clsx';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-gray-500 mt-1">Manage your job postings and view matches</p>
        </div>
        <Link
          to="/jobs/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all hover:shadow-md"
        >
          <Plus className="h-5 w-5 mr-2" />
          Post New Job
        </Link>
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
          {jobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Briefcase className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs posted</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new job posting.</p>
              <div className="mt-6">
                <Link
                  to="/jobs/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Post Job
                </Link>
              </div>
            </div>
          ) : (
            jobs.map(job => (
              <div key={job._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden group">
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
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1.5 text-gray-400" />
                        {job.category}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <Link
                      to={`/jobs/${job._id}/matching`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Users className="w-4 h-4 mr-2 text-gray-500" />
                      Find Matches
                    </Link>
                    <Link
                      to={`/jobs/${job._id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
