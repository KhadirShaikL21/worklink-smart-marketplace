import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, Clock, IndianRupee, CheckCircle, AlertTriangle, User, Star, Briefcase, Lock, Upload, Video, Image as ImageIcon, Loader2, Navigation } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import JobTrackingMap from '../components/JobTrackingMap';
import { JobDetailSkeleton } from '../components/ui/Skeleton.jsx';

export default function JobDetail() {
  const { user } = useAuth();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [rating, setRating] = useState({ punctuality: 5, quality: 5, professionalism: 5, review: '', workerId: '' });
  const [otp, setOtp] = useState('');
  const [starting, setStarting] = useState(false);
  
  // Completion states
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([null, null, null]);
  const [uploading, setUploading] = useState(false);

  // Payment states
  const [clientSecret, setClientSecret] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/api/jobs/${jobId}`);
      setJob(res.data.job);
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        clientSecret={clientSecret} 
        onSuccess={handlePaymentSuccess}
      />

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
                  <span className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    job.urgency === 'emergency' ? 'bg-red-100 text-red-800' :
                    job.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
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
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Map & Tracking Section */}
            {(job.status === 'assigned' || job.status === 'en_route' || job.status === 'in_progress') && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                      Live Location Tracking
                    </h3>
                    {/* Worker Action: Start Travel */}
                    {job.assignedWorkers?.some(w => (w._id || w) === user?._id) && job.status === 'assigned' && (
                      <button
                        onClick={startTravel}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Start Travel
                      </button>
                    )}
                     {job.status === 'en_route' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 animate-pulse">
                          Worker En Route
                        </span>
                     )}
                 </div>
                 <JobTrackingMap 
                    job={job} 
                    userRole={job.customer === user?._id ? 'customer' : 'worker'} 
                 />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="flex flex-wrap gap-4">
              {user?._id === job.customer && (
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
                    Create Payment
                  </button>
                </>
              )}
            </div>

            {statusMsg && (
              <div className="mt-4 p-4 rounded-md bg-green-50 border border-green-200">
                <p className="text-sm text-green-800">{statusMsg}</p>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Worker Job Completion Section */}
          {job.assignedWorkers?.some(w => (w._id || w) === user?._id) && job.status === 'in_progress' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Complete Job & Upload Proof
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Please upload proof of work to complete this job. 3 photos are mandatory.
              </p>
              
              <form onSubmit={handleCompleteJob} className="space-y-6">
                {/* Photo Uploads */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Photo Proof (3 Required)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[0, 1, 2].map(idx => (
                      <div key={idx} className="relative group">
                        <div className={`
                          relative border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center transition-colors
                          ${photoFiles[idx] ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
                        `}>
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

          {/* Satisfaction - Only for Customer */}
          {user?._id === job.customer && (job.status === 'assigned' || job.status === 'in_progress' || job.status === 'completed') ? (
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
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* OTP Section */}
          {(job.status === 'assigned' || job.status === 'en_route') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-primary-600" />
                Start Job Verification
              </h3>
              
              {user?._id === job.customer && (
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 mb-2">Share this code with the worker when they arrive:</p>
                  <div className="text-3xl font-bold text-blue-900 tracking-widest">{job.startOtp}</div>
                </div>
              )}

              {job.assignedWorkers?.some(w => (w._id || w) === user?._id) && (
                <form onSubmit={startJob} className="space-y-3">
                  <p className="text-sm text-gray-600">Ask the customer for the start code:</p>
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
                  {job.hoursEstimate} hours
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                  Coordinates: {job.location?.coordinates?.join(', ')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Rate Worker - Only visible after completion */}
          {job.status === 'completed' && user?._id === job.customer && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Worker</h3>
              <form onSubmit={submitRating} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Worker</label>
                  {job.assignedWorkers && job.assignedWorkers.length > 0 ? (
                    <select
                      value={rating.workerId}
                      onChange={e => setRating({ ...rating, workerId: e.target.value })}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="">Select a worker</option>
                      {job.assignedWorkers.map(w => (
                        <option key={w._id} value={w._id}>
                          {w.name} ({w.email})
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
                    <label className="block text-xs font-medium text-gray-500">Professional</label>
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
    </div>
  );
}
