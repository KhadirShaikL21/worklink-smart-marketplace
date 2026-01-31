import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Phone, Mail, CheckCircle, XCircle, Camera, Shield, Loader2, AlertTriangle, MapPin, Briefcase, Star, Edit2, Save, X } from 'lucide-react';
import clsx from 'clsx';

export default function Profile() {
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
            setEditForm({
              name: currentUser.name,
              phone: currentUser.phone,
              title: currentUser.workerProfile?.title || '',
              bio: currentUser.workerProfile?.bio || '',
              hourlyRate: currentUser.workerProfile?.hourlyRate || '',
              skills: currentUser.workerProfile?.skills?.join(', ') || '',
              experienceYears: currentUser.workerProfile?.experienceYears || ''
            });
          } else {
             // Not logged in and trying to view own profile
             // setError('Please log in to view your profile');
          }
        } else {
          try {
             const res = await api.get(`/api/users/${userId}`);
             setProfileUser(res.data.user || res.data);
          } catch (e) {
             try {
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
      await api.patch('/api/auth/me', {
        name: editForm.name,
        phone: editForm.phone,
        title: editForm.title,
        bio: editForm.bio,
        hourlyRate: editForm.hourlyRate,
        experienceYears: editForm.experienceYears,
        skills: editForm.skills
      });

      await refreshUser();
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
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
      
      // Update user with new avatar
      await api.patch('/api/auth/me', { avatarUrl: url });
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
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
      // Assuming verification endpoint exists
      await api.post('/api/verification/verify-otp', { code: otpCode });
      await refreshUser();
      setOtpStatus('verified');
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid code');
    }
  };

  if (loading || authLoading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  if (error || !profileUser) return (
    <div className="flex justify-center items-center min-h-[50vh] text-red-500">
      {error || 'User not found'}
    </div>
  );

  const user = profileUser;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        {/* Header / Cover */}
        <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600"></div>
        
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden relative">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <User className="w-10 h-10" />
                  </div>
                )}
                {isOwnProfile && (
                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                    <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div className="flex-1 ml-6 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 flex items-center gap-2">
                {user.roles?.includes('worker') ? 'Skilled Worker' : 'Customer'}
                {user.workerProfile?.title && ` • ${user.workerProfile.title}`}
                {user.roles?.includes('worker') && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-2 ${user.workerProfile?.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.workerProfile?.isAvailable ? 'Available' : 'Busy'}
                  </span>
                )}
              </p>
            </div>
            {isOwnProfile && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Profile</h3>
                <button type="button" onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-full h-full p-3 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Change Photo
                      <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
                    </label>
                    {uploading && <span className="ml-2 text-xs text-gray-500">Uploading...</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              {user.roles?.includes('worker') && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Worker Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={e => setEditForm({...editForm, title: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="e.g. Senior Plumber"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          value={editForm.bio}
                          onChange={e => setEditForm({...editForm, bio: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₹)</label>
                        <input
                          type="number"
                          value={editForm.hourlyRate}
                          onChange={e => setEditForm({...editForm, hourlyRate: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                        <input
                          type="number"
                          value={editForm.experienceYears}
                          onChange={e => setEditForm({...editForm, experienceYears: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                        <input
                          type="text"
                          value={editForm.skills}
                          onChange={e => setEditForm({...editForm, skills: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Plumbing, Pipe Fitting, etc."
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <h3 className="font-semibold text-gray-900">Contact Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Status */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-600" />
                    Verification
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Phone</span>
                      {user.isVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </div>

                  {isOwnProfile && !user.isVerified && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {otpStatus === 'idle' && (
                        <button 
                          onClick={requestOtp}
                          className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                        >
                          Verify Phone Number
                        </button>
                      )}
                      
                      {otpStatus === 'sending' && (
                        <div className="flex justify-center py-2">
                          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                        </div>
                      )}

                      {otpStatus === 'sent' && (
                        <form onSubmit={verifyOtp} className="space-y-3">
                          <p className="text-xs text-gray-500">Enter the code sent to your phone.</p>
                          {devCode && (
                            <div className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded">
                              Dev Code: {devCode}
                            </div>
                          )}
                          <input
                            type="text"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            placeholder="Enter OTP"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <button 
                            type="submit"
                            className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                          >
                            Verify Code
                          </button>
                        </form>
                      )}

                      {otpError && (
                        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {otpError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Details */}
              <div className="md:col-span-2 space-y-6">
                {user.roles?.includes('worker') && user.workerProfile && (
                  <>
                    <div className="prose prose-sm max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                      <p className="text-gray-600 leading-relaxed">
                        {user.workerProfile.bio || 'No bio provided yet.'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.workerProfile.skills?.map((skill, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                        <div className="text-sm text-gray-500 mb-1">Hourly Rate</div>
                        <div className="text-xl font-bold text-gray-900">
                          ₹{user.workerProfile.hourlyRate}/hr
                        </div>
                      </div>
                      <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                        <div className="text-sm text-gray-500 mb-1">Experience</div>
                        <div className="text-xl font-bold text-gray-900">
                          {user.workerProfile.experienceYears || 0} years
                        </div>
                      </div>
                      <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                        <div className="text-sm text-gray-500 mb-1">Jobs Done</div>
                        <div className="text-xl font-bold text-gray-900">
                          {user.workerProfile.completedJobs || 0}
                        </div>
                      </div>
                      <div className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                        <div className="text-sm text-gray-500 mb-1">Status</div>
                        <div className={`text-xl font-bold ${user.workerProfile.isAvailable !== false ? 'text-green-600' : 'text-red-600'}`}>
                          {user.workerProfile.isAvailable !== false ? 'Available' : 'Busy'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {!user.roles?.includes('worker') && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium">Customer Account</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Post jobs and hire workers to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
