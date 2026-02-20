import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Clock, IndianRupee, CheckCircle, AlertTriangle, User, Briefcase, Lock, Video, Image as ImageIcon, Loader2, Navigation, MessageSquare, Phone, ShieldAlert } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import JobTrackingMap from '../components/JobTrackingMap';
import { JobDetailSkeleton } from '../components/ui/Skeleton';

export default function JobDetail() {
  const { user } = useAuth();
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
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerExpired, setTimerExpired] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Payment Issue');
  const [disputeDesc, setDisputeDesc] = useState('');

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
    return new Date(value).toLocaleString();
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
      setStatusMsg('Rating submitted');
      setRating(r => ({ ...r, review: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rate');
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    try {
      if (!disputeDesc.trim()) {
        setError('Please provide a description for the dispute.');
        return;
      }
      await api.post(`/api/jobs/${jobId}/dispute`, { reason: disputeReason, description: disputeDesc });
      setStatusMsg('Dispute raised successfully. Our support team will contact you.');
      setShowDisputeModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise dispute');
    }
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
      setStatusMsg('Payment successful! Job marked as completed.');
      // Reload job to get updated status
      setTimeout(() => load(), 1000); // Small delay to allow webhook to process
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

  const getDirections = () => {
    if (job?.location?.coordinates) {
      const [long, lat] = job.location.coordinates;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${long}`, '_blank');
    }
  };

  useEffect(() => {
    let interval;
    // Only run timer if status is 'assigned' (pending acceptance)
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

  const handleSOS = async () => {
    if (!window.confirm('EMERGENCY: Do you want to trigger SOS? This will alert admins and emergency contacts.')) return;
    try {
      await api.post(`/jobs/${jobId}/sos`, {});
      alert('SOS Signal Sent! Emergency contacts notified.');
    } catch (err) {
      console.error(err);
      alert('Error sending SOS. Please call emergency services directly.');
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
      // Upload Video (Optional)
      let videoUrl = null;
      if (videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('file', videoFile);
        const videoRes = await api.post('/api/uploads/video', videoFormData);
        videoUrl = videoRes.data.url;
      }

      // Upload Photos
      const imageUrls = [];
      for (const file of photoFiles) {
        const photoFormData = new FormData();
        photoFormData.append('file', file);
        const photoRes = await api.post('/api/uploads/image', photoFormData);
        imageUrls.push(photoRes.data.url);
      }

      // Complete Job
      await api.post(`/api/jobs/${jobId}/complete`, { videoUrl, imageUrls });
      setStatusMsg('Job completed successfully! Waiting for customer payment.');
      navigate('/thank-you');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete job');
    } finally {
      setUploading(false);
    }
  };

  if (!job) return <JobDetailSkeleton />;

  const isCompleted = job.status === 'completed';
  
  const timeline = job.timeline || {};
  const summary = job.summary || {};
  const payment = job.payment; // Keep undefined if missing
  const completionProof = job.completionProof || {};
  const toDate = value => {
    if (!value) return null;
    try {
      return new Date(value);
    } catch {
      return null;
    }
  };
  const assignedAtDate = toDate(timeline.assignedAt) || (job.status !== 'open' ? toDate(job.createdAt) : null);
  const completedAtDate = toDate(timeline.completedAt) || (job.status === 'completed' ? toDate(job.updatedAt) : null);
  
  // Safe date operations
  const safeTime = (date) => (date instanceof Date && !isNaN(date) ? date.getTime() : 0);
  const isValidDate = (date) => date instanceof Date && !isNaN(date);

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
  const workerNameFor = workerId => {
    if (!workerId) return 'Worker';
    const id = workerId.toString();
    const match = assignedWorkers.find(w => w && (w._id || w).toString() === id);
    return match?.name || 'Worker';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        clientSecret={clientSecret} 
        onSuccess={handlePaymentSuccess}
      />

      {showDisputeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowDisputeModal(false)}></div>
            </div>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div 
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ShieldAlert className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Raise a Dispute
                    </h3>
                    <div className="mt-2 text-sm text-gray-500 mb-4">
                      <p>If you're facing issues with this job or payment, please let us know. Our team will investigate.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reason</label>
                        <select
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                        >
                          <option value="Payment Issue">Payment Issue</option>
                          <option value="Incomplete Work">Incomplete Work</option>
                          <option value="Poor Quality">Poor Quality</option>
                          <option value="Unprofessional Behavior">Unprofessional Behavior</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          rows={3}
                          className="mt-1 shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                          placeholder="Please provide more details..."
                          value={disputeDesc}
                          onChange={(e) => setDisputeDesc(e.target.value)}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRaiseDispute}
                >
                  Submit Dispute
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDisputeModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="mb-4 p-4 rounded-md bg-green-50 border border-green-200">
          <p className="text-sm text-green-800">{statusMsg}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <div className="flex items-center mt-2 text-sm text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {job.category}
                  </span>
                  <span
                    className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.urgency === 'emergency'
                        ? 'bg-red-100 text-red-800'
                        : job.urgency === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {job.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <p className="mt-2 text-gray-600 whitespace-pre-wrap">{job.description}</p>
            </div>

            {job.media?.problemVideoUrl && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">Problem Video</h3>
                <div className="mt-2 rounded-lg overflow-hidden bg-black aspect-video">
                  <video
                    src={job.media.problemVideoUrl}
                    controls
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Required Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {(job.skillsRequired || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    {skill}
                  </span>
                ))}
                {(job.skillsRequired || []).length === 0 && (
                  <span className="text-sm text-gray-500">No specific skills listed.</span>
                )}
              </div>
            </div>
          </div>

          {!isCompleted && (
            <div className="bg-white rounded-xl shadow-sm border mb-6 border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                  {job.status === 'assigned' ? 'Job Status' : 'Live Location Tracking'}
                </h3>

                {/* Worker: Accept Status */}
                {isAssignedWorker && job.status === 'assigned' && (
                   <div className="flex items-center gap-3">
                      <div className={`text-sm font-bold flex items-center ${timeLeft < 20 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                        <Clock className="w-4 h-4 mr-1" />
                        {timerExpired ? 'Expired' : `${timeLeft}s remaining`}
                      </div>
                      <button
                        onClick={handleAcceptJob}
                        disabled={timerExpired}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                      >
                        Accept Work
                      </button>
                   </div>
                )}
                
                {/* Customer: Waiting Status */}
                {isCustomer && job.status === 'assigned' && (
                   <span className="text-sm font-medium text-orange-600 animate-pulse flex items-center">
                     <Clock className="w-4 h-4 mr-1" />
                     Waiting for worker to accept...
                   </span>
                )}

                {/* Worker: Actions after acceptance */}
                {isAssignedWorker && (job.status === 'accepted' || job.status === 'en_route') && (
                  <div className="flex gap-2">
                     <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${job.location?.coordinates?.[1]},${job.location?.coordinates?.[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Get Directions
                      </a>
                      <button
                        onClick={handleSecureCall}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Secure Call
                      </button>
                      {job.status === 'accepted' && (
                        <button
                          onClick={startTravel}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Start Travel
                        </button>
                      )}
                  </div>
                )}
                
                {/* Customer: Call Worker */}
                {isCustomer && (job.status === 'accepted' || job.status === 'en_route' || job.status === 'in_progress') && (
                   <button
                    onClick={handleSecureCall}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Worker
                  </button>
                )}

                {job.status === 'en_route' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 animate-pulse">
                    Worker En Route
                  </span>
                )}
              </div>
              {/* Only show map if NOT assigned (i.e. accepted/en_route) */}
              {job.status !== 'assigned' && <JobTrackingMap job={job} userRole={jobRole} />}
            </div>
          )}

          {(isCompleted || travelStartedAtDate || startedAtDate || completedAtDate) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Completion Overview</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Assigned</dt>
                  <dd className="mt-1 text-gray-900">{formatDateTime(assignedAtDate)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Travel Started</dt>
                  <dd className="mt-1 text-gray-900">{formatDateTime(travelStartedAtDate)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Work Started</dt>
                  <dd className="mt-1 text-gray-900">{formatDateTime(startedAtDate)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Completed</dt>
                  <dd className="mt-1 text-gray-900">{formatDateTime(completedAtDate)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Travel Duration</dt>
                  <dd className="mt-1 text-gray-900">{formatDuration(travelDurationMinutes)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Work Duration</dt>
                  <dd className="mt-1 text-gray-900">{formatDuration(workDurationMinutes)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Total Time</dt>
                  <dd className="mt-1 text-gray-900">{formatDuration(totalDurationMinutes)}</dd>
                </div>
              </dl>
            </div>
          )}

          {isCompleted && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Proof of Work</h3>
              {completionProof.videoUrl ? (
                <div className="mb-6 aspect-video bg-black rounded-lg overflow-hidden">
                  <video src={completionProof.videoUrl} controls className="w-full h-full" />
                </div>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(completionProof.imageUrls || []).map((url, idx) => (
                  <div key={idx} className="relative h-32 rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {(!completionProof.imageUrls || completionProof.imageUrls.length === 0) && (
                  <p className="text-sm text-gray-500">No proof images uploaded.</p>
                )}
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
              {payment ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Total Payment</dt>
                    <dd className="mt-1 text-gray-900 flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 text-gray-400" />
                      {payment?.total} {payment?.currency}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Payment Status</dt>
                    <dd className="mt-1 text-gray-900 capitalize">{payment?.status ? payment.status.replace(/_/g, ' ') : 'Unknown'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Updated</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(payment?.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Platform Fee</dt>
                    <dd className="mt-1 text-gray-900">{payment?.platformFeePct ?? '—'}%</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-gray-500 mb-2">Payees</dt>
                    <ul className="space-y-2">
                      {(payment?.payees || []).map((p, idx) => (
                        <li key={idx} className="flex justify-between text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                          <span>{workerNameFor(p?.worker)} {p?.status ? `(${p.status.replace(/_/g, ' ')})` : ''}</span>
                          <span>{p?.amount} {payment?.currency}</span>
                        </li>
                      ))}
                      {(payment?.payees || []).length === 0 && (
                        <li className="text-sm text-gray-500">No payouts recorded yet.</li>
                      )}
                    </ul>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-600">Payment intent not created yet. Customer can initiate payment from the Actions panel.</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="flex flex-wrap gap-4">
              {chatRoomId && job.status !== 'open' && (isCustomer || isAssignedWorker) && (
                <button
                  onClick={() => navigate(`/chat?roomId=${chatRoomId}`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Open Team Chat
                </button>
              )}

              {isCustomer && (
                <>
                  {job.status === 'open' && (
                    <button
                      onClick={() => navigate(`/jobs/${jobId}/matching`)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Find Matches
                    </button>
                  )}

                  <button
                    onClick={createPayment}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <IndianRupee className="w-4 h-4 mr-2" />
                    {payment ? 'Manage Payment' : 'Create Payment'}
                  </button>
                </>
              )}

              {(isCustomer || isAssignedWorker) && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Raise Dispute
                </button>
              )}
            </div>
          </div>

          {isAssignedWorker && job.status === 'in_progress' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Complete Job & Upload Proof
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Please upload proof of work to complete this job. 3 photos are mandatory.
              </p>

              <form onSubmit={handleCompleteJob} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo Proof (3 Required)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map(idx => (
                      <div key={idx} className="relative group">
                        <div
                          className={`relative border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center transition-colors ${
                            photoFiles[idx] ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                          }`}
                        >
                          {photoFiles[idx] ? (
                            <>
                              <img
                                src={URL.createObjectURL(photoFiles[idx])}
                                alt="Preview"
                                className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-80"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFiles = [...photoFiles];
                                    newFiles[idx] = null;
                                    setPhotoFiles(newFiles);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-full transform scale-90 group-hover:scale-100 transition-all"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                              </div>
                            </>
                          ) : (
                            <label htmlFor={`photo-${idx}`} className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-500 font-medium">Upload Photo {idx + 1}</span>
                              <input
                                id={`photo-${idx}`}
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={e => {
                                  if (e.target.files[0]) {
                                    const newFiles = [...photoFiles];
                                    newFiles[idx] = e.target.files[0];
                                    setPhotoFiles(newFiles);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video Proof (Optional)</label>
                  <div
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
                      videoFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    }`}
                  >
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

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Uploading Proof...
                      </>
                    ) : (
                      'Submit Proof & Complete Job'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isCustomer && (job.status === 'assigned' || job.status === 'in_progress' || job.status === 'completed') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Job Completion</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => markSatisfaction('satisfied')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Satisfied
                </button>
                <button
                  onClick={() => markSatisfaction('not_satisfied')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Not Satisfied
                </button>
                <button
                  onClick={() => markSatisfaction('needs_fix')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Needs Fix
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Journey & Verification Section */}
          {(job.status === 'accepted' || job.status === 'en_route') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
               {/* 1. Worker needs to mark arrival first */}
               {isAssignedWorker && job.status === 'en_route' && !job.timeline?.arrivedAt && (
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-center">
                      <Navigation className="w-5 h-5 mr-2 text-blue-600" />
                      Arrived at Location?
                    </h3>
                    <button
                      onClick={markArrived}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Yes, I have Reached Destination
                    </button>
                    <p className="mt-2 text-xs text-gray-500">Tap only when you are at the customer's location.</p>
                  </div>
               )}

               {/* 2. OTP Verification Section (Shown if Accept/Arrived) */}
               {/* Show OTP only if: 
                   - Is Customer (Always show code)
                   - Is Worker AND (Status is Accepted OR (En Route AND Arrived)) 
                   Wait, user said 'reached destination after displayed when he start travel', implying sequence: Accepted -> Start Travel -> En Route -> Reached -> OTP.
                   So if status is accepted, worker sees 'Start Travel' button elsewhere (in Actions).
                   If En Route, worker should mark Arrived.
                   So OTP input should show ONLY if Arrived.
               */}
               {((isCustomer) || (isAssignedWorker && (job.status === 'en_route' && job.timeline?.arrivedAt) || job.status === 'in_progress')) && (
                 <>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-primary-600" />
                      Start Job Verification
                    </h3>
                    
                    {isCustomer && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-blue-800 mb-2">Share this code with the worker when they arrive:</p>
                        <div className="text-3xl font-bold text-blue-900 tracking-widest">{job.startOtp}</div>
                        {job.status === 'en_route' && !job.timeline?.arrivedAt && (
                           <p className="mt-2 text-xs text-orange-600 flex items-center justify-center">
                             <Navigation className="w-3 h-3 mr-1" />
                             Worker is en route
                           </p>
                        )}
                         {job.status === 'en_route' && job.timeline?.arrivedAt && (
                           <p className="mt-2 text-xs text-green-600 flex items-center justify-center">
                             <MapPin className="w-3 h-3 mr-1" />
                             Worker has arrived!
                           </p>
                        )}
                      </div>
                    )}

                    {isAssignedWorker && (
                      <form onSubmit={startJob} className="space-y-3">
                        <p className="text-sm text-gray-600">You have arrived! Ask customer for the code:</p>
                        <input
                          type="text"
                          maxLength={4}
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          placeholder="Enter 4-digit OTP"
                          className="block w-full text-center text-2xl tracking-widest rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                        <button
                          type="submit"
                          disabled={starting || otp.length !== 4}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300"
                        >
                          {starting ? 'Verifying...' : 'Start Job'}
                        </button>
                      </form>
                    )}
                 </>
               )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Details</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Budget</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <IndianRupee className="w-4 h-4 mr-1 text-gray-400" />
                  {job.budget?.min} - {job.budget?.max} {job.budget?.currency}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estimated Hours</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-gray-400" />
                  {job.hoursEstimate ? `${job.hoursEstimate} hours` : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 flex flex-col">
                  {job.location?.coordinates && (
                     <div className="flex items-center">
                       <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                       <span className="truncate">
                        {job.location.coordinates[1].toFixed(4)}, {job.location.coordinates[0].toFixed(4)}
                       </span>
                     </div>
                  )}
                  {/* Fallback if address is missing */}
                  <span className="text-xs text-gray-500 ml-5">
                    (Click map to view precise location)
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Rate Worker - Only visible after completion */}
          {job.status === 'completed' && isCustomer && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Worker</h3>
              <form onSubmit={submitRating} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Worker</label>
                  {assignedWorkers && assignedWorkers.length > 0 ? (
                    <select
                      value={rating.workerId}
                      onChange={e => setRating({ ...rating, workerId: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="">Select a worker</option>
                      {assignedWorkers.map(w => (
                        <option key={w._id || w} value={w._id || w}>
                          {w.name || 'Worker'} {w.email ? `(${w.email})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={rating.workerId} 
                      onChange={e => setRating({ ...rating, workerId: e.target.value })} 
                      required 
                      placeholder="Enter Worker ID"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Punctuality</label>
                    <input 
                      type="number" min="1" max="5" 
                      value={rating.punctuality} 
                      onChange={e => setRating({ ...rating, punctuality: e.target.value })} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Quality</label>
                    <input 
                      type="number" min="1" max="5" 
                      value={rating.quality} 
                      onChange={e => setRating({ ...rating, quality: e.target.value })} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Professionalism</label>
                    <input 
                      type="number" min="1" max="5" 
                      value={rating.professionalism} 
                      onChange={e => setRating({ ...rating, professionalism: e.target.value })} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Review</label>
                  <textarea 
                    rows={3} 
                    value={rating.review} 
                    onChange={e => setRating({ ...rating, review: e.target.value })} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Submit Rating
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      
      {/* SOS Button */}
      {(job.status === 'in_progress' || job.status === 'en_route') && (isCustomer || isAssignedWorker) && (
        <button
          onClick={handleSOS}
          title="EMERGENCY SOS"
          className="fixed bottom-32 right-6 p-4 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 animate-pulse z-40"
        >
          <AlertTriangle className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}
