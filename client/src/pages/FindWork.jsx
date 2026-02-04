import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Briefcase, Clock, AlertCircle, CheckCircle, MapPin, IndianRupee } from 'lucide-react';
import { JobCardSkeleton } from '../components/ui/Skeleton.jsx';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export default function FindWork() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/jobs/open');
      setJobs(res.data.jobs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleApply = async (jobId) => {
    setApplying(jobId);
    setError('');
    setSuccessMsg('');
    try {
      await api.post(`/api/jobs/${jobId}/apply`);
      setSuccessMsg('Application submitted successfully!');
      // Remove the job from the list or mark as applied
      setJobs(jobs.filter(j => j._id !== jobId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(null);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">{t('findWork.title')}</h1>
          <p className="text-gray-500 mt-1">{t('findWork.subtitle')}</p>
        </div>
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

      {successMsg && (
        <div className="rounded-md bg-green-50 p-4 mb-6 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{successMsg}</h3>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No open jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later for new opportunities.</p>
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
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <IndianRupee className="w-4 h-4 mr-1.5 text-gray-400" />
                        ₹{job.budget?.min} - ₹{job.budget?.max}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                        {job.hoursEstimate} {t('findWork.hrsEst')}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                        {job.location?.address || t('findWork.locationNotSpecified')}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.skillsRequired?.map((skill, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:min-w-[140px]">
                    <button
                      onClick={() => handleApply(job._id)}
                      disabled={applying === job._id}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {applying === job._id ? t('common.loading') : t('findWork.applyNow')}
                    </button>
                    <Link
                      to={`/jobs/${job._id}`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                    >
                      {t('findWork.viewDetails')}
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
