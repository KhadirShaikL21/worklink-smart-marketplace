import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import NavigationHeader from '../components/NavigationHeader';

const StatusBadge = ({ status }) => {
  const styles = {
    open: 'bg-red-100 text-red-700 border-red-200',
    in_review: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  
  const icons = {
    open: AlertTriangle,
    in_review: Clock,
    resolved: CheckCircle,
    closed: ShieldCheck
  };

  const Icon = icons[status] || AlertTriangle;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.open}`}>
      <Icon className="w-3.5 h-3.5 mr-1.5" />
      {status ? status.replace('_', ' ').toUpperCase() : 'OPEN'}
    </span>
  );
};

export default function MyDisputes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/api/jobs/my-disputes');
      if (res.data && res.data.disputes) {
          setDisputes(res.data.disputes);
      }
    } catch (err) {
      console.error('Failed to fetch disputes', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <NavigationHeader 
        title="My Support Tickets" 
        subtitle="Track and manage your dispute resolutions"
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'My Support Tickets' }
        ]}
        showBack={true}
      />
      
      <div className="mb-8 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-sm font-medium text-gray-600 inline-block">
         Total Issues: <span className="text-primary-600 font-bold ml-1">{disputes.length}</span>
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <ShieldCheck className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No disputes found</h3>
          <p className="text-gray-500 mt-2 mb-6">You don't have any active support tickets.</p>
          <Link to="/jobs" className="text-primary-600 font-semibold hover:text-primary-700">
            View My Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {disputes.map((job) => (
            <motion.div 
              key={job._id}
              layout
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div 
                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => toggleExpand(job._id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${job.dispute.status === 'resolved' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {job.dispute.status === 'resolved' ? 
                      <CheckCircle className="w-6 h-6 text-green-600" /> : 
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {job.dispute.category ? job.dispute.category.toUpperCase().replace('_', ' ') : 'ISSUE'}
                      </h3>
                      <StatusBadge status={job.dispute.status} />
                    </div>
                    <p className="text-gray-500 text-sm">
                      Job: <span className="font-medium text-gray-900">{job.title}</span> • {new Date(job.dispute.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-400">
                   <span className="text-sm mr-2 md:hidden">View Details</span>
                   {expandedId === job._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === job._id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 bg-gray-50/50"
                  >
                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-8">
                         <div>
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Issue Details</h4>
                            <div className="bg-white p-4 rounded-xl border border-gray-200">
                              <div className="mb-4">
                                <span className="text-xs font-bold text-gray-500 block mb-1">SPECIFIC REASON</span>
                                <p className="text-gray-900 font-medium">{job.dispute.reason}</p>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-gray-500 block mb-1">DESCRIPTION</span>
                                <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  {job.dispute.description || 'No description provided.'}
                                </p>
                              </div>
                            </div>
                         </div>

                         <div>
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Resolution Status</h4>
                            {job.dispute.resolution ? (
                               <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                                  <div className="flex items-center mb-2">
                                     <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                     <span className="font-bold text-green-800">Resolved: {job.dispute.resolution.outcome || job.dispute.resolution}</span>
                                  </div>
                                  <p className="text-sm text-green-700 mt-2 font-medium">
                                      {job.dispute.resolution.adminNote || "The dispute has been resolved according to our platform policies."}
                                  </p>
                                  <div className="mt-3 text-xs text-green-600">
                                     Resolved on {new Date(job.dispute.resolvedAt || job.updatedAt).toLocaleDateString()}
                                  </div>
                               </div>
                            ) : (
                               <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                                  <div className="flex items-start">
                                     <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                                     <div>
                                        <p className="font-bold text-blue-800 mb-1">Review in Progress</p>
                                        <p className="text-sm text-blue-700">
                                           We are working on your issue. You will get an update very soon.
                                        </p>
                                     </div>
                                  </div>
                               </div>
                            )}

                            {job.dispute.history && job.dispute.history.length > 0 && (
                               <div className="mt-6">
                                  <h5 className="text-xs font-bold text-gray-500 mb-3">ACTIVITY LOG</h5>
                                  <div className="space-y-3 pl-2 border-l-2 border-gray-200">
                                     {job.dispute.history.map((step, idx) => (
                                        <div key={idx} className="relative pl-4">
                                           <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
                                           <p className="text-sm font-medium text-gray-900">{step.action.replace('_', ' ').toUpperCase()}</p>
                                           <p className="text-xs text-gray-500 mt-0.5">{step.note}</p>
                                           <p className="text-[10px] text-gray-400 mt-1">{new Date(step.timestamp).toLocaleString()}</p>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                      
                      <div className="mt-8 flex justify-end">
                         <Link 
                           to={`/jobs/${job._id}`} 
                           className="text-primary-600 font-semibold text-sm hover:underline"
                         >
                           View Job Page →
                         </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}