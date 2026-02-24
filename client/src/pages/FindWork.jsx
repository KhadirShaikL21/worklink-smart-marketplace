import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  Briefcase, IndianRupee, MapPin, Clock, Search, SlidersHorizontal, 
  ArrowRight, CheckCircle, AlertTriangle, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { JobDetailSkeleton } from '../components/ui/Skeleton';

export default function FindWork() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const loadJobs = async () => {
    setLoading(true);
    try {
      // Actually fetch open jobs
      const res = await api.get('/api/jobs'); 
      // Filter for open only if API returns mixed
      const openJobs = (res.data.jobs || []).filter(j => j.status === 'open');
      setJobs(openJobs);
    } catch (err) {
      console.error(err);
      setError('Failed to load available jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleApply = async (e, jobId) => {
    e.stopPropagation(); // prevent card click
    setApplying(jobId);
    setError('');
    setSuccessMsg('');
    try {
      await api.post(`/api/jobs/${jobId}/apply`);
      setSuccessMsg('Application sent! Use chat to follow up.');
      // Remove from list or mark applied visually
      setJobs(prev => prev.filter(j => j._id !== jobId)); 
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply');
      setTimeout(() => setError(''), 3000);
    } finally {
      setApplying(null);
    }
  };

  // Filter Logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || job.category?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const categories = ['all', ...new Set(jobs.map(j => j.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* Hero Header */}
      <div className="relative bg-white border-b border-gray-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="max-w-2xl"
           >
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">Find Work That Matters</h1>
              <p className="mt-3 text-lg text-gray-500">Discover new opportunities near you and grow your business.</p>
           </motion.div>

           {/* Search Bar */}
           <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm shadow-sm transition-all"
                      placeholder="Search jobs by title or keyword..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              
              {/* Filter Pills */}
              <div className="flex items-center overflow-x-auto pb-2 sm:pb-0 gap-2 no-scrollbar">
                  {categories.slice(0, 5).map(cat => (
                      <button
                          key={cat}
                          onClick={() => setFilter(cat)}
                          className={clsx(
                              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                              filter === cat 
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" 
                                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          )}
                      >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                  ))}
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Messages */}
        <AnimatePresence>
            {(successMsg || error) && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={clsx(
                        "mb-6 p-4 rounded-xl border flex items-center gap-3",
                        successMsg ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                    )}
                >
                    {successMsg ? <CheckCircle className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
                    <span className="font-medium">{successMsg || error}</span>
                </motion.div>
            )}
        </AnimatePresence>

        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[1,2,3,4,5,6].map(i => (
                     <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-64 animate-pulse">
                         <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                         <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                         <div className="h-4 bg-gray-100 rounded w-1/3 mb-6" />
                         <div className="h-20 bg-gray-50 rounded mb-4" />
                         <div className="h-10 bg-gray-200 rounded w-full mt-auto" />
                     </div>
                 ))}
             </div>
        ) : filteredJobs.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                 <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-gray-900">No jobs found</h3>
                 <p className="text-gray-500 max-w-sm mx-auto mt-2">Try adjusting your filters or check back later for new opportunities.</p>
                 <button onClick={() => {setSearchTerm(''); setFilter('all');}} className="mt-6 text-indigo-600 font-semibold hover:text-indigo-700">Clear Filters</button>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                    <motion.div
                        key={job._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer flex flex-col"
                        onClick={() => navigate(`/jobs/${job._id}`)}
                    >
                        <div className="p-6 flex-1">
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                     <span className={clsx(
                                         "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide",
                                         job.urgency === 'emergency' ? 'bg-red-50 text-red-700' : 
                                         job.urgency === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                                     )}>
                                         {job.urgency}
                                     </span>
                                     <h3 className="text-lg font-bold text-gray-900 mt-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                         {job.title}
                                     </h3>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-lg font-bold text-gray-900">₹{job.budget?.min}</div>
                                     <div className="text-xs text-gray-400">Fixed Rate</div>
                                 </div>
                             </div>

                             <div className="space-y-2 mb-6">
                                 <div className="flex items-center text-sm text-gray-500">
                                     <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                     <span className="truncate">{job.location?.address || 'Remote / Unknown'}</span>
                                 </div>
                                 <div className="flex items-center text-sm text-gray-500">
                                     <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                     <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                 </div>
                             </div>

                             <div className="flex flex-wrap gap-2 mb-4">
                                 {(job.skillsRequired || []).slice(0, 3).map((skill, i) => (
                                     <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
                                         {skill}
                                     </span>
                                 ))}
                                 {(job.skillsRequired?.length > 3) && (
                                     <span className="px-2 py-1 bg-gray-50 text-gray-400 text-xs rounded-md">+{job.skillsRequired.length - 3}</span>
                                 )}
                             </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center group-hover:bg-indigo-50/50 transition-colors">
                            <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600 flex items-center">
                                View Details <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </span>
                            <button
                                onClick={(e) => handleApply(e, job._id)}
                                disabled={applying === job._id}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {applying === job._id ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Apply Now'}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
