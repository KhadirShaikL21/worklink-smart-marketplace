import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  MapPin, Clock, IndianRupee, CheckCircle, AlertTriangle, User, Briefcase, 
  Lock, Video, Image as ImageIcon, Loader2, Navigation, MessageSquare, 
  Phone, ShieldAlert, Calendar, ChevronRight, Play, Star, UploadCloud, Banknote, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import PaymentModal from '../components/PaymentModal';
import DisputeResolutionModal from '../components/DisputeResolutionModal';
import JobTrackingMap from '../components/JobTrackingMap';
import { JobDetailSkeleton } from '../components/ui/Skeleton';

const HammerIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25V7.86c0-.55-.45-1-1-1H16.4c-.84 0-1.65-.33-2.25-.93L12.9 4.68c-.6-.6-1.4-.93-2.25-.93H4.86c-.55 0-1 .45-1 1v6.78c0 .84.33 1.65.93 2.25L12 21"/></svg>
  );

export default function JobDetail() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [rating, setRating] = useState({ punctuality: 5, quality: 5, professionalism: 5, review: '', workerId: '' });
  const [otp, setOtp] = useState('');
  const [starting, setStarting] = useState(false);
  
  const [videoFile, setVideoFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([null, null, null]);
  const [uploading, setUploading] = useState(false);

  // Payment states
  const [clientSecret, setClientSecret] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerExpired, setTimerExpired] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  
  // Derived state calculations need to be hoisted or safe-guarded
  const currentUserId = user?._id?.toString();
  const customerId = job && (job.customer?._id || job.customer)?.toString();
  // Safe filtering for assigned workers
  const assignedWorkers = job ? (job.assignedWorkers || []).filter(w => w && (w._id || w)) : [];
  const assignedWorkerIds = assignedWorkers.map(w => (w._id || w).toString());
  
  const isCustomer = !!currentUserId && !!customerId && customerId === currentUserId;
  const isAssignedWorker = !!currentUserId && assignedWorkerIds.includes(currentUserId);
  const jobRole = isCustomer ? 'customer' : 'worker';

  const formatDateTime = value => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = minutes => {
    if (minutes === undefined || minutes === null) return '—';
    const totalMinutes = Math.max(0, minutes);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours && mins) return `${hours}h ${mins}m`;
    if (hours) return `${hours}h`;
    return `${mins}m`;
  };

  const load = async () => {
    try {
      const res = await api.get(`/api/jobs/${jobId}`);
      setJob(res.data.job);
      setChatRoomId(null);

      // Load Chat Room once job is beyond open state
      if (res.data.job.status !== 'open') {
        try {
          const roomRes = await api.get('/api/chat/rooms');
          const jobIdStr = jobId.toString();
          const jobRoom = (roomRes.data.rooms || []).find(r => {
            const roomJobId = r.job?._id || r.job;
            return roomJobId && roomJobId.toString() === jobIdStr;
          });
          setChatRoomId(jobRoom?._id || null);
        } catch (e) {
          console.error('Failed to load chat room', e);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // Real-time updates listener
  useEffect(() => {
    if (!socket) return;
    
    // Listen for notification events that contain this jobId
    const handleNotification = (data) => {
        if (data && data.metadata && data.metadata.jobId === jobId) {
            console.log('Realtime Job Update Triggered:', data);
            load(); // Refresh job data
        }
    };

    // The backend in realtime.js emits 'notification:new'
    socket.on('notification:new', handleNotification);
    
    // Also listen for general job updates if broadcasted
    // If your backend emits 'job_update' specifically:
    socket.on('job_update', handleNotification);

    return () => {
      socket.off('notification:new', handleNotification);
      socket.off('job_update', handleNotification);
    };
  }, [socket, jobId]);

  const markSatisfaction = async status => {
    try {
      await api.post(`/api/jobs/${jobId}/satisfaction`, { status });
      setStatusMsg(`Marked as ${status.replace('_', ' ')}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    }
  };

  const submitRating = async e => {
    e.preventDefault();
    try {
      await api.post(`/api/jobs/${jobId}/rating`, {
        taskId: null,
        workerId: rating.workerId,
        punctuality: Number(rating.punctuality),
        quality: Number(rating.quality),
        professionalism: Number(rating.professionalism),
        review: rating.review
      });
      setStatusMsg('Rating submitted successfully');
      setRating(r => ({ ...r, review: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rate');
    }
  };

  const handleDisputeRaised = () => {
    setStatusMsg('Dispute raised successfully. Our support team will investigate.');
    setShowDisputeModal(false);
    load();
  };

  const createPayment = async () => {
    if (!job?.budget?.max) return;
    try {
      const res = await api.post('/api/payments/intent', { jobId, total: job.budget.max, payees: [] });
      setClientSecret(res.data.clientSecret);
      setShowPaymentModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment intent failed');
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
      setShowPaymentModal(false);
      setStatusMsg('Payment successful! Please rate the worker.');
      // Update local state without reload first
      if (job) {
          setJob(prev => ({ ...prev, status: 'completed', payment: { ...prev.payment, status: 'succeeded' } }));
      }
      setRating(prev => ({ ...prev, workerId: (job.assignedWorkers?.[0]?._id || job.assignedWorkers?.[0] || '').toString() }));
      setShowRatingModal(true);
      setTimeout(() => load(), 2000); 
  };

  const handleAcceptJob = async () => {
    try {
      await api.post(`/api/jobs/${jobId}/accept`);
      setStatusMsg('Job Accepted! Please proceed to location.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept job');
    }
  };

  const handleSecureCall = () => {
    alert('Initiating secure privacy-preserving call via WorkLink Server... Connecting *******' + (jobRole === 'customer' ? '987' : '123'));
  };

  useEffect(() => {
    let interval;
    if (job?.status === 'assigned' && isAssignedWorker && !timerExpired && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [job, isAssignedWorker, timerExpired, timeLeft]);

  const startJob = async (e) => {
    e.preventDefault();
    setStarting(true);
    try {
      await api.post(`/api/jobs/${jobId}/start`, { otp });
      setStatusMsg('Job started successfully!');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start job');
    } finally {
      setStarting(false);
    }
  };

  const startTravel = async () => {
    try {
      await api.post(`/api/jobs/${jobId}/start-travel`);
      setStatusMsg('Travel started! Customer notified.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start travel');
    }
  };

  const markArrived = async () => {
    try {
      await api.post(`/api/jobs/${jobId}/arrived`);
      setStatusMsg('Marked as Arrived! Customer notified.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark arrival');
    }
  };

  const handleCompleteJob = async (e) => {
    e.preventDefault();
    if (photoFiles.some(f => !f)) {
      setError('Please upload 3 photos as proof of work.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      let videoUrl = null;
      if (videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('file', videoFile);
        const videoRes = await api.post('/api/uploads/video', videoFormData);
        videoUrl = videoRes.data.url;
      }

      const imageUrls = [];
      for (const file of photoFiles) {
        const photoFormData = new FormData();
        photoFormData.append('file', file);
        const photoRes = await api.post('/api/uploads/image', photoFormData);
        imageUrls.push(photoRes.data.url);
      }

      await api.post(`/api/jobs/${jobId}/complete`, { videoUrl, imageUrls });
      setStatusMsg('Job submitted! Please rate the customer.');
      // Show rating modal for worker immediately or wait?
      // Usually payment comes first, but if flow is Worker -> Complete -> Rate Customer -> Wait Payment?
      // Or Worker -> Complete -> Customer Pays -> Worker receives Notif -> Rate Customer?
      // Let's assume Worker can rate Customer immediately upon completion for UX simplicity.
      setRating(prev => ({ ...prev, workerId: customerId })); // Prepare to rate customer
      setShowRatingModal(true); 
      load();
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to complete job');
    } finally {
      setUploading(false);
    }
  };

  if (!job) return <JobDetailSkeleton />;

  const isCompleted = job.status === 'completed';
  const timeline = job.timeline || {};
  const summary = job.summary || {};
  const payment = job.payment;
  const completionProof = job.completionProof || {};

  // Date Parsing Helpers
  const toDate = value => {
    if (!value) return null;
    try { return new Date(value); } catch { return null; }
  };
  const safeTime = (date) => (date instanceof Date && !isNaN(date) ? date.getTime() : 0);
  const isValidDate = (date) => date instanceof Date && !isNaN(date);

  const assignedAtDate = toDate(timeline.assignedAt) || (job.status !== 'open' ? toDate(job.createdAt) : null);
  const completedAtDate = toDate(timeline.completedAt) || (job.status === 'completed' ? toDate(job.updatedAt) : null);
  
  const inferredStartedFromWork = isValidDate(completedAtDate) && typeof summary.workDurationMinutes === 'number'
    ? new Date(safeTime(completedAtDate) - summary.workDurationMinutes * 60000)
    : null;
    
  const startedAtDate = toDate(timeline.startedAt)
    || inferredStartedFromWork
    || ((job.status === 'in_progress' || job.status === 'completed') ? toDate(job.updatedAt) : null);
    
  const inferredTravelFromSummary = isValidDate(startedAtDate) && typeof summary.travelDurationMinutes === 'number'
    ? new Date(safeTime(startedAtDate) - summary.travelDurationMinutes * 60000)
    : null;
    
  const travelStartedAtDate = toDate(timeline.travelStartedAt) || inferredTravelFromSummary;
  
  const travelDurationMinutes = typeof summary.travelDurationMinutes === 'number'
    ? summary.travelDurationMinutes
    : (isValidDate(travelStartedAtDate) && isValidDate(startedAtDate)
        ? Math.max(0, Math.round((safeTime(startedAtDate) - safeTime(travelStartedAtDate)) / 60000))
        : null);
        
  const workDurationMinutes = typeof summary.workDurationMinutes === 'number'
    ? summary.workDurationMinutes
    : (isValidDate(startedAtDate) && isValidDate(completedAtDate)
        ? Math.max(0, Math.round((safeTime(completedAtDate) - safeTime(startedAtDate)) / 60000))
        : null);
        
  const totalDurationMinutes = typeof summary.totalDurationMinutes === 'number'
    ? summary.totalDurationMinutes
    : ([travelDurationMinutes, workDurationMinutes].reduce((acc, minutes) => {
        if (typeof minutes !== 'number') return acc;
        return (acc || 0) + minutes;
      }, null));



// Helper components
const HammerIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25V7.86c0-.55-.45-1-1-1H16.4c-.84 0-1.65-.33-2.25-.93L12.9 4.68c-.6-.6-1.4-.93-2.25-.93H4.86c-.55 0-1 .45-1 1v6.78c0 .84.33 1.65.93 2.25L12 21"/></svg>
);



  const StatusBadge = ({ status }) => {
    const config = {
      open: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Briefcase },
      assigned: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock },
      accepted: { bg: 'bg-purple-50', text: 'text-purple-700', icon:CheckCircle },
      en_route: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: Navigation },
      arrived: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: MapPin },
      in_progress: { bg: 'bg-orange-50', text: 'text-orange-700', icon: HammerIcon },
      completed: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: ShieldAlert },
    };
    const Conf = config[status] || config.open;
    const Icon = Conf.icon;

    return (
      <span className={clsx("inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ring-inset", Conf.bg, Conf.text, "ring-gray-500/10")}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {t(`jobDetail.status.${status}`)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        clientSecret={clientSecret} 
        onSuccess={handlePaymentSuccess}
      />

      {showInvoiceModal && job?.payment && (
        <InvoiceModal 
          isOpen={showInvoiceModal} 
          onClose={() => setShowInvoiceModal(false)} 
          payment={job.payment} 
          job={job}
        />
      )}

      <RatingModal 
        isOpen={showRatingModal} 
        onClose={() => setShowRatingModal(false)}
        onSubmit={submitRating}
        rating={rating}
        setRating={setRating}
        isWorkerRatingCustomer={jobRole === 'worker'}
      />

      <DisputeResolutionModal 
        isOpen={showDisputeModal} 
        onClose={() => setShowDisputeModal(false)}
        jobId={jobId}
        onDisputeRaised={handleDisputeRaised}
      />

      {/* Header Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
                <div>
                   <div className="flex items-center gap-3 mb-3">
                       <StatusBadge status={job.status} />
                       <span className={clsx(
                           "px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset",
                           job.urgency === 'emergency' ? 'bg-red-50 text-red-700 ring-red-600/10' :
                           job.urgency === 'high' ? 'bg-orange-50 text-orange-700 ring-orange-600/10' :
                           'bg-blue-50 text-blue-700 ring-blue-600/10'
                       )}>
                           {t(`urgency.${job.urgency.toLowerCase()}`, job.urgency.toUpperCase())}
                       </span>
                   </div>
                   <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{job.title}</h1>
                   <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                       <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" /> {job.location?.address}</span>
                       <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {t('jobDetail.posted')} {formatDateTime(job.createdAt)}</span>
                       <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1.5" /> {t(`categories.${job.category.toLowerCase()}`, job.category)}</span>
                   </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="text-2xl font-bold text-gray-900">
                        ₹{job.budget?.min} - ₹{job.budget?.max}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {chatRoomId && job.status !== 'open' && (isCustomer || isAssignedWorker) && (
                            <button onClick={() => navigate(`/chat?roomId=${chatRoomId}`)} className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-sm font-semibold text-gray-700">
                                <MessageSquare className="w-4 h-4" /> {t('jobDetail.message')}
                            </button>
                        )}
                        {(isCustomer || isAssignedWorker) && !['completed', 'cancelled'].includes(job.status) && (
                            <button onClick={handleSecureCall} className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-sm font-semibold text-gray-700">
                                <Phone className="w-4 h-4" /> {t('jobDetail.call')}
                            </button>
                        )}
                         {(isCustomer || isAssignedWorker) && !['completed', 'cancelled'].includes(job.status) && (
                            <button onClick={() => setShowDisputeModal(true)} className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-red-200 shadow-sm hover:bg-red-50 text-sm font-semibold text-red-600">
                                <ShieldAlert className="w-4 h-4" /> {t('jobDetail.raiseDispute')}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
                 {/* Status Messages */}
                <AnimatePresence>
                    {(statusMsg || error) && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            {statusMsg && <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium flex items-center"><CheckCircle className="w-4 h-4 mr-2" />{statusMsg}</div>}
                            {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center"><ShieldAlert className="w-4 h-4 mr-2" />{error}</div>}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tracking & Map */}
                {job.status !== 'open' && job.status !== 'assigned' && !isCompleted && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 overflow-hidden">
                        <JobTrackingMap job={job} userRole={jobRole} />
                    </div>
                )}

                {/* Worker Specific Actions Card */}
                {isAssignedWorker && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">{t('jobDetail.yourTasks')}</h3>
                            {timeLeft > 0 && job.status === 'assigned' && (
                                <span className={clsx("text-xs font-bold px-2 py-1 rounded-md", timeLeft < 20 ? "bg-red-100 text-red-700 animate-pulse" : "bg-gray-200 text-gray-700")}>
                                     {timerExpired ? t('jobDetail.expired') : `${timeLeft}s ${t('jobDetail.timeLeft')}`}
                                </span>
                            )}
                         </div>
                         <div className="p-6">
                            {job.status === 'assigned' && (
                                <div className="text-center py-6">
                                    <Clock className="w-12 h-12 text-primary-200 mx-auto mb-3" />
                                    <h4 className="text-lg font-medium text-gray-900">{t('jobDetail.jobAssigned')}</h4>
                                    <p className="text-gray-500 mb-6">{t('jobDetail.acceptPrompt')}</p>
                                    <button onClick={handleAcceptJob} disabled={timerExpired} className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg shadow-green-600/20 disabled:bg-gray-300 disabled:shadow-none transition-all">
                                        {t('jobDetail.acceptJob')}
                                    </button>
                                </div>
                            )}

                            {job.status === 'accepted' && (
                                 <div className="flex gap-4">
                                     <button onClick={startTravel} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                                         <Navigation className="w-5 h-5" /> {t('jobDetail.startTravel')}
                                     </button>
                                     <a href={`https://www.google.com/maps/dir/?api=1&destination=${job.location?.coordinates?.[1]},${job.location?.coordinates?.[0]}`} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 flex items-center justify-center gap-2">
                                         <MapPin className="w-5 h-5" /> {t('jobDetail.directions')}
                                     </a>
                                 </div>
                            )}

                            {job.status === 'en_route' && (
                                <div className="text-center">
                                    <p className="text-gray-600 mb-4">{t('jobDetail.enRouteMessage')}</p>
                                    <button onClick={markArrived} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
                                        {t('jobDetail.arrived')}
                                    </button>
                                </div>
                            )}

                            {/* Job Start OTP Input */}
                            {job.status === 'arrived' && (
                                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                                    <h4 className="text-indigo-900 font-semibold mb-2">{t('jobDetail.startJob')}</h4>
                                    <p className="text-sm text-indigo-700 mb-4">{t('jobDetail.askOtp')}</p>
                                    <form onSubmit={startJob} className="flex gap-3">
                                        <input 
                                            type="text" 
                                            maxLength={6} 
                                            placeholder={t('jobDetail.enterOtp')}
                                            value={otp} 
                                            onChange={e => setOtp(e.target.value)}
                                            className="flex-1 rounded-xl border-gray-200 focus:ring-indigo-500 focus:border-indigo-500 text-center font-mono text-lg tracking-widest"
                                        />
                                        <button type="submit" disabled={starting || otp.length < 4} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
                                            {starting ? <Loader2 className="animate-spin w-5 h-5" /> : t('jobDetail.start')}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Completion Form */}
                            {job.status === 'in_progress' && (
                                <div className="space-y-6">
                                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
                                         {t('jobDetail.uploadProof')}
                                     </div>
                                     <form onSubmit={handleCompleteJob}>
                                         {/* Video Upload Section */}
                                         <div className="mb-4">
                                            <label className={clsx("w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden", videoFile ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-sidebar-primary/50 hover:bg-gray-50")}>
                                                {videoFile ? (
                                                    <div className="text-center">
                                                        <Video className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                                        <span className="text-sm font-medium text-green-700">{videoFile.name} (Ready to upload)</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Video className="w-8 h-8 text-gray-400 mb-2" />
                                                        <span className="text-sm font-medium text-gray-700">Upload Work Video (Required)</span>
                                                        <span className="text-xs text-gray-500 mt-1">MP4/WebM recommended</span>
                                                    </>
                                                )}
                                                <input type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files[0])} required />
                                            </label>
                                         </div>

                                         <div className="grid grid-cols-3 gap-4 mb-6">
                                             {[0, 1, 2].map(idx => (
                                                 <label key={idx} className={clsx("aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden", photoFiles[idx] ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-sidebar-primary/50 hover:bg-gray-50")}>
                                                     {photoFiles[idx] ? (
                                                         <img src={URL.createObjectURL(photoFiles[idx])} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                                                     ) : (
                                                         <>
                                                            <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                                                            <span className="text-xs text-gray-500">{t('jobDetail.photo')} {idx+1}</span>
                                                         </>
                                                     )}
                                                     <input type="file" accept="image/*" className="hidden" onChange={e => {
                                                         const newFiles = [...photoFiles];
                                                         newFiles[idx] = e.target.files[0];
                                                         setPhotoFiles(newFiles);
                                                     }} />
                                                 </label>
                                             ))}
                                         </div>
                                         <button type="submit" disabled={uploading} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 flex items-center justify-center gap-2">
                                             {uploading ? <Loader2 className="animate-spin w-5 h-5"/> : <CheckCircle className="w-5 h-5" />}
                                             {t('jobDetail.completeJob')}
                                         </button>
                                     </form>
                                </div>
                            )}
                         </div>
                    </div>
                )}

                 {/* Customer Specific Actions */}
                {isCustomer && (
                     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                         <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">{t('jobDetail.actions')}</h3>
                         
                         {job.status === 'open' && (!assignedWorkers || assignedWorkers.length === 0) && (
                             <button onClick={() => navigate(`/jobs/${jobId}/matching`)} className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 shadow-md flex items-center justify-center gap-2">
                                 <User className="w-5 h-5" /> {t('jobDetail.findWorkers')}
                             </button>
                         )}

                         {/* OTP Display for Customer */}
                         {job.status === 'arrived' && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{t('jobDetail.startCode')}</span>
                                    <div className="text-2xl font-mono font-bold text-indigo-900 mt-1">{job.startOtp || job.otp || '****'}</div>
                                    <p className="text-xs text-indigo-700 mt-1">{t('jobDetail.shareOtp')}</p>
                                </div>
                                <ShieldAlert className="w-8 h-8 text-indigo-300" />
                            </div>
                         )}

                         {/* Payment Action */}
                         {(job.status === 'completed' || (!payment && job.status === 'in_progress')) && (
                             <button onClick={() => payment ? setShowInvoiceModal(true) : createPayment()} className={clsx("w-full py-3 text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-2", payment ? "bg-gray-800 hover:bg-gray-900 border border-gray-700" : "bg-gray-900 hover:bg-gray-800")}>
                                 <Banknote className="w-5 h-5" /> {payment ? t('jobDetail.viewPayment') : t('jobDetail.processPayment')}
                             </button>
                         )}
                     </div>
                )}
                
                {/* Description Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t('jobDetail.description')}</h3>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                    
                    {/* Skills */}
                    <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('jobDetail.requiredSkills')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {(job.skillsRequired || []).map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg font-medium">{t(`categories.${skill.toLowerCase()}`, skill)}</span>
                            ))}
                        </div>
                    </div>

                    {/* Problem Video */}
                    {job.media?.problemVideoUrl && (
                         <div className="mt-6">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('jobDetail.videoNote')}</h4>
                            <div className="rounded-xl overflow-hidden bg-black aspect-video relative group cursor-pointer">
                                <video src={job.media.problemVideoUrl} controls className="w-full h-full" />
                            </div>
                         </div>
                    )}
                </div>

                {/* Proof of Completion */}
                {isCompleted && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                         <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600"/> {t('jobDetail.proofOfWork')}</h3>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                             {(completionProof.imageUrls || []).map((url, i) => (
                                 <div key={i} className="rounded-lg overflow-hidden border border-gray-200 aspect-square">
                                     <img src={url} alt="Proof" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                 </div>
                             ))}
                         </div>
                    </div>
                )}
            </div>

            {/* Right Column - Info Sidebar */}
            <div className="space-y-6">
                 {/* Assigned Worker/Customer Info */}
                 {(isCustomer && job.assignedWorkers?.length > 0) && (
                     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                         <h3 className="font-bold text-gray-900 mb-4">{t('jobDetail.assignedProfessional')}</h3>
                         {job.assignedWorkers.map(worker => {
                             const workerName = typeof worker === 'string' ? `Worker ${worker.slice(-4)}` : (worker?.name || worker?.user?.name || `Worker ${(worker?._id || 'unknown').toString().slice(-4)}`);
                             const workerInitial = workerName ? workerName[0].toUpperCase() : 'W';
                             
                             return (
                             <div key={worker?._id || worker} className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                                     {workerInitial}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <h4 className="font-semibold text-gray-900 truncate">{workerName}</h4>
                                     <div className="flex items-center text-sm text-yellow-500">
                                         <Star className="w-3.5 h-3.5 fill-current" />
                                         <span className="ml-1 text-gray-600 font-medium">4.8 (120 reviews)</span>
                                     </div>
                                 </div>
                             </div>
                            );
                         })}
                     </div>
                 )}

                 {/* Timeline / Progress */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                     <h3 className="font-bold text-gray-900 mb-6">{t('jobDetail.jobTimeline')}</h3>
                     <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                         {[
                             { label: t('jobDetail.timeline.posted'), date: job.createdAt, active: true },
                             { label: t('jobDetail.timeline.assigned'), date: timeline.assignedAt, active: !!timeline.assignedAt },
                             { label: t('jobDetail.timeline.travelStarted'), date: timeline.travelStartedAt, active: !!timeline.travelStartedAt },
                             { label: t('jobDetail.timeline.workStarted'), date: timeline.startedAt, active: !!timeline.startedAt },
                             { label: t('jobDetail.timeline.completed'), date: timeline.completedAt, active: !!timeline.completedAt },
                         ].map((step, i) => (
                             <div key={i} className="relative">
                                 <div className={clsx("absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2", step.active ? "bg-primary-600 border-primary-600" : "bg-white border-gray-300")} />
                                 <p className={clsx("text-sm font-medium leading-none", step.active ? "text-gray-900" : "text-gray-400")}>{step.label}</p>
                                 <span className="text-xs text-gray-400 mt-1 block">{step.active ? formatDateTime(step.date) : '—'}</span>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Payment Summary */}
                 {payment && (
                     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                         <h3 className="font-bold text-gray-900 mb-4">{t('jobDetail.paymentSummary')}</h3>
                         <div className="space-y-3 text-sm">
                             <div className="flex justify-between">
                                 <span className="text-gray-500">{t('jobDetail.amount')}</span>
                                 <span className="font-medium">₹{payment.total}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-gray-500">{t('jobDetail.platformFee')}</span>
                                 <span className="font-medium text-red-500">-{payment.platformFeePct}%</span>
                             </div>
                             <div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900">
                                 <span>{t('jobDetail.netTotal')}</span>
                                 <span>₹{payment.total}</span>
                             </div>
                             <div className={clsx("mt-3 text-center py-2 rounded-lg font-medium text-xs uppercase tracking-wide", payment.status === 'succeeded' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                                {payment.status === 'succeeded' ? t('invoice.succeeded') : (payment.status || t('jobDetail.pending'))}
                             </div>
                         </div>
                     </div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
}

const CameraIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);

const InvoiceModal = ({ isOpen, onClose, payment, job }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
                <div className="px-8 py-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                             <Banknote className="w-6 h-6 text-green-400"/> {t('invoice.title')}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">WorkLink Marketplace</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center py-4 border-b border-gray-100 border-dashed">
                        <span className="text-gray-500 font-medium">{t('invoice.paymentId')}</span>
                        <span className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-200">{payment._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                         <div>
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('invoice.date')}</label>
                             <p className="font-semibold text-gray-900 mt-1">{new Date(payment.createdAt || Date.now()).toLocaleDateString()}</p>
                         </div>
                         <div className="text-right">
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('invoice.status')}</label>
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1 uppercase">
                                 {t('invoice.succeeded')}
                             </span>
                         </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">{t(`categories.${job.category?.toLowerCase()}`, job.category)} {t('common.service')}</span>
                            <span className="font-bold text-gray-900">₹{payment.total}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                             <span className="text-lg font-bold text-gray-900">{t('invoice.amountPaid')}</span>
                             <span className="text-2xl font-bold text-primary-600">₹{payment.total}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 text-sm text-gray-500">
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase">{t('invoice.payer')}</span>
                            <span className="font-medium text-gray-900">{job.customer?.name}</span>
                        </div>
                        <div className="text-right">
                             <span className="block text-xs font-bold text-gray-400 uppercase">{t('invoice.payee')}</span>
                             <span className="font-medium text-gray-900">{job.assignedWorkers?.[0]?.name || 'WorkLink Professional'}</span>
                        </div>
                    </div>

                    <button onClick={onClose} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                        {t('invoice.close')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const RatingModal = ({ isOpen, onClose, onSubmit, rating, setRating, isWorkerRatingCustomer }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }}
               className='bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden'
            >
                <div className='p-6 border-b border-gray-100 flex justify-between items-center'>
                    <h3 className='text-xl font-bold text-gray-900'>
                        {isWorkerRatingCustomer ? 'Rate Customer' : t('jobDetail.rateWorker')}
                    </h3>
                    <button onClick={onClose}><X className='w-5 h-5 text-gray-400 hover:text-gray-600'/></button>
                </div>
                <form onSubmit={onSubmit} className='p-6 space-y-6'>
                    <div className='space-y-4'>
                        {[
                            { id: 'punctuality', label: t('jobDetail.punctuality'), icon: Clock },
                            { id: 'quality', label: isWorkerRatingCustomer ? 'Communication' : t('jobDetail.quality'), icon: CheckCircle },
                            { id: 'professionalism', label: t('jobDetail.professionalism'), icon: User }
                        ].map((field) => (
                            <div key={field.id} className='flex items-center justify-between'>
                                <div className='flex items-center gap-2 text-gray-700 font-medium'>
                                    <field.icon className='w-4 h-4 text-gray-400' />
                                    {field.label}
                                </div>
                                <div className='flex gap-1'>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type='button'
                                            onClick={() => setRating(prev => ({ ...prev, [field.id]: star }))}
                                            className={clsx('transition-transform hover:scale-110', star <= rating[field.id] ? 'text-yellow-400 fill-current' : 'text-gray-300')}
                                        >
                                            <Star className='w-6 h-6 fill-current' />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>{t('jobDetail.leaveReview')}</label>
                        <textarea
                            value={rating.review}
                            onChange={e => setRating(prev => ({ ...prev, review: e.target.value }))}
                            className='w-full rounded-xl border-gray-200 focus:ring-primary-500 focus:border-primary-500'
                            rows={3}
                            placeholder={t('jobDetail.reviewPlaceholder')}
                        />
                    </div>

                    <button type='submit' className='w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20'>
                        {t('jobDetail.submitRating')}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
