import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Phone, Mail, CheckCircle, XCircle, Camera, Shield, Loader2, AlertTriangle, MapPin, Briefcase, Star, Edit2, Save, X, Award, Clock, IndianRupee, CreditCard } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { t } = useTranslation();
  const { user: currentUser, refreshUser, loading: authLoading } = useAuth();
  const { userId } = useParams();
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Action states
  const [uploading, setUploading] = useState(false);
  const [otpStatus, setOtpStatus] = useState('idle');
  const [otpError, setOtpError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState('');

  const isOwnProfile = !userId || userId === 'undefined' || userId === currentUser?.id;

  useEffect(() => {
    const loadProfile = async () => {
      if (authLoading) return;

      setLoading(true);
      setError('');
      try {
        if (isOwnProfile) {
          if (currentUser) {
            setProfileUser(currentUser);
            // Ensure bankDetails is properly initialized
            const defaultBankDetails = {
              accountHolderName: '',
              accountNumber: '',
              bankName: '',
              ifscCode: '',
              upiId: ''
            };
            setEditForm({
              name: currentUser.name || '',
              phone: currentUser.phone || '',
              title: currentUser.workerProfile?.title || '',
              bio: currentUser.workerProfile?.bio || '',
              hourlyRate: currentUser.workerProfile?.hourlyRate || '',
              skills: currentUser.workerProfile?.skills?.join(', ') || '',
              experienceYears: currentUser.workerProfile?.experienceYears || '',
              bankDetails: { ...defaultBankDetails, ...(currentUser.bankDetails || {}) }
            });
          }
        } else {
          try {
             // Try fetching as user first
             const res = await api.get(`/api/users/${userId}`);
             setProfileUser(res.data.user || res.data);
          } catch (e) {
             try {
                // If failed, try worker endpoint (sometimes distinct)
                const res = await api.get(`/api/workers/${userId}`);
                setProfileUser(res.data.worker || res.data);
             } catch (e2) {
                setError('User not found');
             }
          }
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, currentUser, isOwnProfile, authLoading]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.patch('/api/auth/me', {
        name: editForm.name,
        phone: editForm.phone,
        title: editForm.title,
        bio: editForm.bio,
        hourlyRate: editForm.hourlyRate,
        experienceYears: editForm.experienceYears,
        skills: editForm.skills,
        bankDetails: editForm.bankDetails
      });

      // Update profile user with the response data
      if (response.data && response.data.user) {
        setProfileUser(response.data.user);
      }
      
      // Also refresh the auth context
      await refreshUser();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async e => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const up = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = up.data.url;
      
      await api.patch('/api/auth/me', { avatarUrl: url });
      await refreshUser();
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const requestOtp = async () => {
    if (!isOwnProfile) return;
    setOtpStatus('sending');
    setOtpError('');
    setDevCode('');
    try {
      const res = await api.post('/api/verification/request-otp');
      setOtpStatus('sent');
      if (res.data.devCode) setDevCode(res.data.devCode);
      toast.success('Verification code sent!');
    } catch (err) {
      setOtpStatus('idle');
      setOtpError(err.response?.data?.message || 'Failed to send code');
    }
  };

  const verifyOtp = async e => {
    e.preventDefault();
    if (!isOwnProfile) return;
    setOtpError('');
    try {
      await api.post('/api/verification/verify-otp', { code: otpCode });
      await refreshUser();
      setOtpStatus('verified');
      toast.success('Phone verified successfully!');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid code');
    }
  };

  if (loading || authLoading) return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)]">
      <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
    </div>
  );

  if (error || !profileUser) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-gray-500">
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
      <p className="text-lg font-medium">{error || 'User not found'}</p>
      <Link to="/" className="mt-4 text-primary-600 hover:underline">Go Home</Link>
    </div>
  );

  const user = profileUser;
  const isWorker = user.roles?.includes('worker');
  const workerProfile = user.workerProfile || {};

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header / Cover Section */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
        >
          <div className="h-48 bg-gradient-to-r from-primary-600 to-indigo-700 relative">
             <div className="absolute inset-0 bg-black/10"></div>
          </div>
          
          <div className="px-8 pb-8">
            <div className="relative flex flex-col sm:flex-row justify-between items-end -mt-16 sm:-mt-20 gap-6">
              <div className="flex items-end gap-6 w-full">
                <div className="relative group shrink-0">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden relative">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <User className="w-16 h-16 sm:w-20 sm:h-20" />
                      </div>
                    )}
                    {isOwnProfile && (
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                        {uploading ? (
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : (
                          <div className="flex flex-col items-center text-white">
                             <Camera className="w-8 h-8 mb-1" />
                             <span className="text-xs font-medium">{t('profile.changePhoto')}</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex-1 pb-2 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                     <div>
                        <h1 className="text-3xl font-bold text-gray-900 truncate">{user.name}</h1>
                        <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                            {isWorker ? (
                                <>
                                    <span className="text-primary-600 font-semibold">{workerProfile.title || t('profile.skilledProfessional')}</span>
                                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full hidden sm:block"></span>
                                </>
                            ) : t('profile.valuedCustomer')}
                            
                            {isWorker && (
                                <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide", 
                                    workerProfile.isAvailable ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200')}>
                                    {workerProfile.isAvailable ? t('profile.available') : t('profile.busy')}
                                </span>
                            )}
                        </p>
                     </div>
                     
                     {isOwnProfile && !isEditing && (
                        <div className="flex gap-3 shrink-0">
                             <Link 
                                to="/my-disputes" 
                                className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all hover:shadow-md flex items-center gap-2 shadow-sm"
                            >
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                                <span className="hidden sm:inline">{t('profile.disputes')}</span>
                            </Link>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all hover:shadow-lg flex items-center gap-2 shadow-sm active:scale-95 duration-200"
                            >
                                <Edit2 className="w-4 h-4" />
                                {t('profile.editProfile')}
                            </button>
                        </div>
                     )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
        {isEditing ? (
            <motion.div
                key="edit-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8"
            >
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{t('profile.editDetails')}</h2>
                        <p className="text-sm text-gray-500 mt-1">{t('profile.updateInfo')}</p>
                    </div>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" /> {t('profile.personalInfo')}
                            </h3>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.fullName')}</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.phone')}</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {isWorker && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> {t('profile.professionalInfo')}
                                </h3>
                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.title')}</label>
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                            placeholder="e.g. Master Electrician"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.hourlyRate')}</label>
                                            <div className="relative">
                                                <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={editForm.hourlyRate}
                                                    onChange={e => setEditForm({...editForm, hourlyRate: e.target.value})}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profile.experience')}</label>
                                            <input
                                                type="number"
                                                value={editForm.experienceYears}
                                                onChange={e => setEditForm({...editForm, experienceYears: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Details (For Workers Only) */}
                        {isWorker && (
                        <div className="space-y-4 md:col-span-2 border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <IndianRupee className="w-4 h-4" /> {t('profile.paymentDetails') || 'Payment Details'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('wallet.accountHolderName') || 'Account Name'}</label>
                                    <input
                                        type="text"
                                        value={editForm.bankDetails?.accountHolderName || ''}
                                        onChange={e => setEditForm({...editForm, bankDetails: {...editForm.bankDetails, accountHolderName: e.target.value}})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                        placeholder="Name on Bank Account"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('wallet.bankName') || 'Bank Name'}</label>
                                    <input
                                        type="text"
                                        value={editForm.bankDetails?.bankName || ''}
                                        onChange={e => setEditForm({...editForm, bankDetails: {...editForm.bankDetails, bankName: e.target.value}})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                        placeholder="Bank Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('wallet.accountNumber') || 'Account Number'}</label>
                                    <input
                                        type="password"
                                        value={editForm.bankDetails?.accountNumber || ''}
                                        onChange={e => setEditForm({...editForm, bankDetails: {...editForm.bankDetails, accountNumber: e.target.value}})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                        placeholder="************"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('wallet.ifscCode') || 'IFSC Code'}</label>
                                    <input
                                        type="text"
                                        value={editForm.bankDetails?.ifscCode || ''}
                                        onChange={e => setEditForm({...editForm, bankDetails: {...editForm.bankDetails, ifscCode: e.target.value}})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                        placeholder="SBIN0001234"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('wallet.upiId') || 'UPI ID'}</label>
                                    <input
                                        type="text"
                                        value={editForm.bankDetails?.upiId || ''}
                                        onChange={e => setEditForm({...editForm, bankDetails: {...editForm.bankDetails, upiId: e.target.value}})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                        placeholder="username@upi"
                                    />
                                </div>
                            </div>
                        </div>
                        )}
                    </div>

                        {isWorker ? (
                        <div className="pt-6 border-t border-gray-100">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                        rows="4"
                                        placeholder={t('profile.bioPlaceholder')}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">{t('profile.skills')}</label>
                                    <textarea
                                        value={editForm.skills}
                                        onChange={e => setEditForm({...editForm, skills: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50/50"
                                        rows="4"
                                        placeholder="Plumbing, Leak Detection, Pipe Fitting"
                                    />
                                    <p className="text-xs text-gray-500">{t('profile.skillsHelp')}</p>
                                </div>
                             </div>
                        </div>
                        ) : null}

                    <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                        >
                            {t('profile.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 text-white bg-primary-600 hover:bg-primary-700 rounded-xl font-medium shadow-lg shadow-primary-600/20 flex items-center gap-2 active:scale-95 transition-all"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {t('profile.saveChanges')}
                        </button>
                    </div>
                </form>
            </motion.div>
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Left Column - Stats & Info */}
               <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="md:col-span-1 space-y-6"
               >
                 {/* Rating Card */}
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                   <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      {t('profile.stats.title')}
                   </h3>
                   <div className="flex items-center mb-6">
                     <span className="text-5xl font-extrabold text-gray-900 mr-4">{user.ratingStats?.average || '0.0'}</span>
                     <div>
                       <div className="flex text-yellow-400 gap-0.5 mb-1">
                         {[1, 2, 3, 4, 5].map((s) => (
                           <Star key={s} className={`w-4 h-4 ${s <= Math.round(user.ratingStats?.average || 0) ? 'fill-current' : 'text-gray-200'}`} />
                         ))}
                       </div>
                       <p className="text-sm font-medium text-gray-500">{user.ratingStats?.count || 0} {t('profile.stats.reviews')}</p>
                     </div>
                   </div>
                   
                   <div className="space-y-4 pt-4 border-t border-gray-100">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-gray-500 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" /> {t('profile.stats.jobsDone')}
                       </span>
                       <span className="font-bold text-gray-900">{workerProfile.completedJobs || user.completedJobs || 0}</span>
                     </div>
                     {isWorker && (
                        <>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4 text-green-600" /> {t('profile.hourlyRate')}
                                </span>
                                <span className="font-bold text-gray-900">₹{workerProfile.hourlyRate || 0}/hr</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary-500" /> {t('profile.experience')}
                                </span>
                                <span className="font-bold text-gray-900">{workerProfile.experienceYears || 0} {t('profile.years')}</span>
                            </div>
                        </>
                     )}
                   </div>
                 </div>

                 {/* Badges */}
                 {isWorker && workerProfile.badges && workerProfile.badges.length > 0 && (
                   <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-100/50 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-yellow-400 w-24 h-24 rounded-full opacity-10 blur-2xl"></div>
                     <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2 relative z-10">
                       <Award className="w-5 h-5 text-yellow-600" />
                       {t('profile.achievements')}
                     </h3>
                     <div className="flex flex-col gap-3 relative z-10">
                       {workerProfile.badges.map((badge, idx) => (
                         <div key={idx} className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm" title={badge.description || ''}>
                           <span className="text-2xl flex-shrink-0 filter drop-shadow-sm">{badge.icon || '🏅'}</span>
                           <div className="flex flex-col overflow-hidden">
                             <span className="text-sm font-bold text-gray-900 truncate">{badge.name}</span>
                             {badge.description && <span className="text-xs text-gray-500 truncate">{badge.description}</span>}
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Contact & Verification */}
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-gray-400" /> {t('profile.verification.title')}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                         <div className="flex items-center text-sm font-medium text-gray-700">
                           <Mail className="w-4 h-4 mr-2.5 text-gray-400" />
                           <span>{t('profile.verification.email')}</span>
                         </div>
                         {user.verification?.emailVerified ? (
                           <span className="text-green-700 bg-green-100 px-2.5 py-1 rounded-md text-xs font-bold flex items-center">
                             {t('profile.verification.verified')}
                           </span>
                         ) : (
                           <span className="text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-md text-xs font-bold flex items-center">
                             {t('profile.verification.pending')}
                           </span>
                         )}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                         <div className="flex items-center text-sm font-medium text-gray-700">
                           <Phone className="w-4 h-4 mr-2.5 text-gray-400" />
                           <span>{t('profile.verification.phone')}</span>
                         </div>
                         {user.verification?.phoneVerified ? (
                           <span className="text-green-700 bg-green-100 px-2.5 py-1 rounded-md text-xs font-bold flex items-center">
                             {t('profile.verification.verified')}
                           </span>
                         ) : (
                           <span className="text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-md text-xs font-bold flex items-center">
                             {t('profile.verification.pending')}
                           </span>
                         )}
                      </div>
                    </div>

                    {isOwnProfile && !user.isVerified && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      {otpStatus === 'idle' && (
                        <button 
                          onClick={requestOtp}
                          className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm"
                        >
                          {t('profile.verification.verifyPhone')}
                        </button>
                      )}
                      
                      {otpStatus === 'sending' && (
                        <div className="flex justify-center py-2.5">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                        </div>
                      )}

                      {otpStatus === 'sent' && (
                        <form onSubmit={verifyOtp} className="space-y-3">
                          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100">
                             {t('profile.verification.codeSent')}
                             {devCode && <div className="font-mono mt-1 font-bold">{t('profile.verification.devCode')} {devCode}</div>}
                          </div>
                          
                          <input
                            type="text"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            placeholder={t('profile.verification.enterCode')}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 text-center tracking-widest font-mono font-bold"
                          />
                          <button 
                            type="submit"
                            className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm shadow-green-600/20"
                          >
                            {t('profile.verification.submit')}
                          </button>
                        </form>
                      )}

                      {otpError && (
                        <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          {otpError}
                        </p>
                      )}
                    </div>
                  )}
                 </div>
               </motion.div>

               {/* Right Column: Details */}
               <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-2 space-y-8"
               >
                 {isWorker && (
                  <>
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                         <User className="w-5 h-5 text-primary-600" /> {t('profile.aboutMe')}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-lg font-light">
                        {workerProfile.bio || <span className="italic text-gray-400">{t('profile.noBio')}</span>}
                      </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                         <CheckCircle className="w-5 h-5 text-primary-600" /> {t('profile.skillsTitle')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {workerProfile.skills && workerProfile.skills.length > 0 ? (
                          workerProfile.skills.map((skill, i) => (
                            <span key={i} className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold border border-gray-200 shadow-sm hover:bg-white hover:border-primary-200 transition-colors cursor-default">
                              {skill}
                            </span>
                          ))
                        ) : (
                           <div className="w-full text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                               {t('profile.noSkills')}
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Bank & UPI Details (Workers Only) */}
                    {isWorker && (
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                         <CreditCard className="w-5 h-5 text-primary-600" /> {t('profile.paymentDetails')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('profile.bank.accountNumber')}</p>
                            <p className="font-mono text-gray-900 font-medium text-lg truncate">
                               {user.bankDetails?.accountNumber ? 
                                 (user.bankDetails.accountNumber.length > 4 ? 
                                   '•••• •••• ' + user.bankDetails.accountNumber.slice(-4) : 
                                   user.bankDetails.accountNumber
                                 ) 
                                 : <span className="text-gray-400 italic text-sm">{t('profile.notProvided')}</span>}
                            </p>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('profile.bank.ifsc')}</p>
                            <p className="font-mono text-gray-900 font-medium text-lg uppercase">
                               {user.bankDetails?.ifscCode || <span className="text-gray-400 italic text-sm">{t('profile.notProvided')}</span>}
                            </p>
                         </div>
                         <div className="md:col-span-2 p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-primary-400 font-bold uppercase tracking-wider mb-1">{t('profile.bank.upiId')}</p>
                                <p className="font-medium text-primary-900 text-lg">
                                {user.bankDetails?.upiId || <span className="text-primary-300 italic text-sm">{t('profile.notProvided')}</span>}
                                </p>
                            </div>
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                <span className="text-xs font-bold text-gray-500">UPI</span>
                            </div>
                         </div>
                      </div>
                    </div>
                    )}

                    {/* Reviews */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Star className="w-5 h-5 text-primary-600" /> {t('profile.reviewsTitle')}
                            </h3>
                            <span className="text-sm font-medium text-gray-500">{user.reviews?.length || 0} {t('profile.total')}</span>
                        </div>
                        
                        <div className="space-y-8">
                            {user.reviews && user.reviews.length > 0 ? (
                            user.reviews.map((review, idx) => (
                                <div key={review.id || idx} className="border-b border-gray-100 last:border-0 pb-8 last:pb-0">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border border-white shadow-sm font-bold text-gray-400 text-xl">
                                            {review.reviewerAvatar ? (
                                            <img src={review.reviewerAvatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                            review.reviewerName?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{review.reviewerName || t('profile.anonymous')}</p>
                                            <p className="text-xs text-gray-500 font-medium">{new Date(review.date || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} className={`w-4 h-4 ${s <= Math.round(review.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                        ))}
                                    </div>
                                </div>
                                {review.comment && (
                                    <div className="pl-16">
                                        <p className="text-gray-600 italic bg-gray-50 p-4 rounded-xl rounded-tl-none">{`"${review.comment}"`}</p>
                                    </div>
                                )}
                                </div>
                            ))
                            ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Star className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-gray-900 font-medium">{t('profile.noReviews')}</p>
                                <p className="text-sm text-gray-500">{t('profile.reviewsPlaceholder')}</p>
                            </div>
                            )}
                        </div>
                    </div>
                  </>
                 )}

                 {!isWorker && (
                    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-3xl border border-gray-200 shadow-sm h-full">
                       <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                          <User className="w-10 h-10 text-primary-500" />
                       </div>
                       <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('profile.customerAccountTitle')}</h3>
                       <p className="text-gray-500 max-w-md mx-auto mb-8">
                         {t('profile.customerAccountDesc')}
                       </p>
                       <Link to="/jobs/new" className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95">
                          {t('profile.customerAccountAction')}
                       </Link>
                    </div>
                 )}
               </motion.div>
             </div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
