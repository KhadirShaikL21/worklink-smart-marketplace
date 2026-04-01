import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Briefcase, AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';
import { JobCardSkeleton } from '../components/ui/Skeleton.jsx';
import NavigationHeader from '../components/NavigationHeader';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export default function WorkerJobs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active', 'completed'

  const loadJobs = () => {
    setLoading(true);
    api
      .get('/api/jobs?role=worker') // Explicitly fetch worker jobs
      .then(res => setJobs(res.data.jobs))
      .catch(err => setError(err.response?.data?.message || 'Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // Auto-refetch worker jobs every 4 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs();
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'active') return ['assigned', 'en_route', 'in_progress'].includes(job.status);
    if (filter === 'completed') return job.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NavigationHeader 
          title={t('myJobs.title')} 
          breadcrumbs={[
            { label: 'Home', path: '/' },
            { label: t('myJobs.title') }
          ]}
          showBack={true}
        />
        
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{t('myJobs.title')}</h1>
          <p className="text-lg text-gray-600 mt-2">{t('myJobs.subtitle')}</p>
        </div>
        <Link 
            to="/find-work" 
            className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all hover:-translate-y-1 text-base group"
        >
            <Search className="w-5 h-5 mr-2 text-gray-400 group-hover:text-primary-600" />
            Find New Work
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('active')}
            className={clsx(
              filter === 'active'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-base transition-colors'
            )}
          >
            {t('myJobs.activeJobs')}
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={clsx(
              filter === 'completed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-base transition-colors'
            )}
          >
            {t('myJobs.completedJobs')}
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
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed shadow-sm">
              <div className="mx-auto h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-10 w-10 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No {filter} jobs found</h3>
              <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                {filter === 'active' ? 'You have no active assignments right now.' : 'You haven\'t completed any jobs yet.'}
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
