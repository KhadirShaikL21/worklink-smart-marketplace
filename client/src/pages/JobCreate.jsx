import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { 
  Sparkles, Save, ArrowRight, Loader2, AlertCircle, CheckCircle2, Video, 
  MapPin, Crosshair, Camera, X, Building, Mic, Image as ImageIcon,
  DollarSign, Clock, Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-shadow.png',
});

function LocationMarker({ position, setPosition }) {
    const map = useMapEvents({
      click(e) {
        setPosition(e.latlng);
        map.flyTo(e.latlng, map.getZoom());
      },
    });
  
    useEffect(() => {
        if(position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);
  
    return position === null ? null : (
      <Marker position={position}></Marker>
    );
}

export default function JobCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('en');
  const [assistant, setAssistant] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  
  // Image Defect Analysis State
  const [defectImage, setDefectImage] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  const [mapPosition, setMapPosition] = useState({lat: 20.5937, lng: 78.9629}); // Default India
  const [loadingLocation, setLoadingLocation] = useState(true);

  const [form, setForm] = useState({
    title: '',
    category: '',
    skillsRequired: '',
    tasks: '',
    hoursEstimate: '',
    budgetMin: '',
    budgetMax: '',
    urgency: 'medium',
    workersNeeded: 1,
    lat: '',
    lng: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Sync map position with form state when map changes
  useEffect(() => {
     if (mapPosition) {
         setForm(f => ({...f, lat: mapPosition.lat, lng: mapPosition.lng}));
     }
  }, [mapPosition]);
  
  const getCurrentLocation = () => {
      setLoadingLocation(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
          setMapPosition({
              lat: position.coords.latitude,
              lng: position.coords.longitude
          });
          setLoadingLocation(false);
        }, function(error) {
            console.error("Error Code = " + error.code + " - " + error.message);
            setLoadingLocation(false);
            setMapPosition({lat: 20.5937, lng: 78.9629});
        });
      } else {
        setLoadingLocation(false);
      }
  };

  useEffect(() => {
      getCurrentLocation();
  }, []);

  // Prefill from AI Assistant or passed state
  useEffect(() => {
    if (location.state?.jobData) {
      const { jobData } = location.state;
      setForm(f => ({
        ...f,
        title: jobData.title || 'New Job Request',
        category: jobData.category || 'General',
        skillsRequired: (jobData.skills_required || ['General Help']).join(', '),
        tasks: (jobData.tasks || []).join('\n') || 'General assistance required',
        hoursEstimate: jobData.hours_estimate || '1',
        budgetMin: jobData.budget?.min || '500', 
        budgetMax: jobData.budget?.max || '1000',
        urgency: jobData.urgency?.toLowerCase() || 'medium',
        workersNeeded: jobData.workers_needed || 1
      }));
      
      if (jobData.worker_brief?.job_summary) {
        setDescription(jobData.worker_brief.job_summary);
      } else if (jobData.description) {
        setDescription(jobData.description);
      }
    }
  }, [location.state]);

  const runAssistant = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/ai/job-assistant', { description, language, audience: 'customer', context: {} });
      setAssistant(res.data);
      const structured = res.data.structured || {};
      setForm(f => ({
        ...f,
        title: structured.title || f.title,
        category: structured.category || f.category,
        skillsRequired: (structured.skills_required || []).join(', '),
        tasks: (structured.tasks || []).join('\n'),
        hoursEstimate: structured.hours_estimate || f.hoursEstimate,
        budgetMin: structured.budget?.min || f.budgetMin,
        budgetMax: structured.budget?.max || f.budgetMax,
        urgency: structured.urgency || f.urgency
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Assistant failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDefectImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDefectImage(file);
    setAnalyzingImage(true);
    setAssistant(null); // Clear previous text assistant results

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/api/ai/analyze-defect', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const structured = res.data.structured || {};
      // Auto-fill form
      setForm(f => ({
         ...f,
         title: structured.title || f.title,
         category: structured.category || f.category,
         urgency: structured.urgency?.toLowerCase() || f.urgency,
         skillsRequired: Array.isArray(structured.skills_required) ? structured.skills_required.join(', ') : f.skillsRequired,
         budgetMin: String(structured.budget_min || f.budgetMin),
         budgetMax: String(structured.budget_max || f.budgetMax),
         hoursEstimate: String(structured.hours_estimate || f.hoursEstimate),
         workersNeeded: String(structured.workers_needed || f.workersNeeded)
      }));

      if (structured.description) setDescription(structured.description);

      setAssistant({ 
        structured, 
        raw: "Image analysis complete! Form has been auto-filled based on the defect detected." 
      });

    } catch (err) {
      console.error('Image analysis failed', err);
      setError('Failed to analyze the image. Please try again or fill manually.');
    } finally {
      setAnalyzingImage(false);
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let problemVideoUrl = null;
      if (videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('file', videoFile);
        const videoRes = await api.post('/api/uploads/video', videoFormData);
        problemVideoUrl = videoRes.data.url;
      }

      const payload = {
        title: form.title,
        category: form.category,
        description,
        skillsRequired: form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
        tasks: form.tasks.split('\n').map(t => t.trim()).filter(Boolean),
        location: {
          type: 'Point',
          coordinates: [Number(form.lng) || 0, Number(form.lat) || 0]
        },
        address: "Location from Map", // Pending geocoding from map, simplified for now
        budget: {
          min: Number(form.budgetMin) || 0,
          max: Number(form.budgetMax) || 0,
          currency: 'INR'
        },
        schedule: {
          hoursEstimate: Number(form.hoursEstimate) || 0
        },
        urgency: form.urgency,
        workersNeeded: Number(form.workersNeeded) || 1,
        problemVideoUrl
      };
      await api.post('/api/jobs', payload);
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = "block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 ml-1";

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 bg-opacity-90 backdrop-blur-md">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
             <div>
                <h1 className="text-xl font-bold text-gray-900">{t('jobCreate.pageTitle')}</h1>
                <p className="text-xs text-gray-500">{t('jobCreate.pageSubtitle')}</p>
             </div>
             <button 
                onClick={onSubmit} 
                className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary-600/20"
                disabled={submitting}
             >
                {submitting ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4" />}
                {submitting ? t('jobCreate.publishing') : t('jobCreate.publish')}
             </button>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: AI Assistant (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                    <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-4">
                        <div className="flex items-center gap-2 text-white">
                             <Sparkles className="w-5 h-5 text-yellow-300" />
                             <h2 className="font-bold">{t('jobCreate.smartAssistant')}</h2>
                        </div>
                        <p className="text-primary-100 text-xs mt-1">{t('jobCreate.assistantDesc')}</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Text Input */}
                        <div>
                             <label className={labelClasses}>{t('jobCreate.whatNeedsDone')}</label>
                             <div className="relative">
                                 <textarea
                                     rows={6}
                                     className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none text-sm transition-all"
                                     placeholder={t('jobCreate.descriptionPlaceholder')}
                                     value={description}
                                     onChange={(e) => setDescription(e.target.value)}
                                 />
                                 <button 
                                    onClick={runAssistant}
                                    disabled={loading || !description.trim()}
                                    className="absolute bottom-3 right-3 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
                                    title={t('jobCreate.generateDetails')}
                                 >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ArrowRight className="w-4 h-4"/>}
                                 </button>
                             </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-2 text-xs text-gray-400 font-medium uppercase">{t('jobCreate.orUsingMedia')}</span>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                             <label className={clsx(
                                 "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                                 defectImage ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
                             )}>
                                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                     {analyzingImage ? (
                                         <>
                                            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
                                            <p className="text-sm text-gray-500">{t('jobCreate.analyzing')}</p>
                                         </>
                                     ) : defectImage ? (
                                         <>
                                            <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                                            <p className="text-sm text-green-700 font-medium text-center px-4 truncate w-full">{defectImage.name}</p>
                                            <p className="text-xs text-green-600">{t('jobCreate.analysisComplete')}</p>
                                         </>
                                     ) : (
                                         <>
                                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500"><span className="font-semibold text-primary-600">{t('jobCreate.uploadPhoto')}</span></p>
                                            <p className="text-xs text-gray-400 mt-1">{t('jobCreate.assistantDesc')}</p>
                                         </>
                                     )}
                                 </div>
                                 <input type="file" className="hidden" accept="image/*" onChange={handleDefectImageUpload} />
                             </label>
                        </div>

                        {/* Video Upload - Optional */}
                        <div>
                             <label className={clsx(
                                 "flex items-center justify-center w-full p-4 border border-gray-200 rounded-xl cursor-pointer bg-white hover:bg-gray-50 transition-colors",
                                 videoFile && "border-green-400 bg-green-50"
                             )}>
                                 {videoFile ? (
                                     <div className="flex items-center gap-2 text-green-700 w-full overflow-hidden">
                                         <Video className="w-5 h-5 flex-shrink-0" />
                                         <span className="text-sm truncate">{videoFile.name}</span>
                                         <button onClick={(e) => { e.preventDefault(); setVideoFile(null); }} className="ml-auto"><X className="w-4 h-4 text-green-600"/></button>
                                     </div>
                                 ) : (
                                     <div className="flex items-center gap-2 text-gray-500">
                                         <Video className="w-5 h-5 text-gray-400" />
                                         <span className="text-sm font-medium">{t('jobCreate.videoNote')}</span>
                                         <input type="file" className="hidden" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} />
                                     </div>
                                 )}
                             </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Complete Form (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
                 {/* Error Banner */}
                 <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ height: 0 }} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                    )}
                 </AnimatePresence>

                 {/* Basic Details Card */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                     <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                         <Building className="w-5 h-5 text-primary-600"/> {t('jobCreate.jobDetails')}
                     </h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="md:col-span-2">
                             <label className={labelClasses}>{t('jobCreate.title')}</label>
                             <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={inputClasses} placeholder={t('jobCreate.descriptionPlaceholder')} />
                         </div>
                         
                         <div>
                             <label className={labelClasses}>{t('jobCreate.category')}</label>
                             <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputClasses}>
                                 <option value="">{t('jobCreate.category')}</option>
                                 <option value="Plumbing">{t('vernacular.plumber')}</option>
                                 <option value="Electrical">{t('vernacular.electrician')}</option>
                                 <option value="Carpentry">{t('vernacular.carpenter')}</option>
                                 <option value="Painting">{t('vernacular.painter')}</option>
                                 <option value="Masonry">{t('vernacular.mason')}</option>
                                 <option value="Cleaning">{t('vernacular.cleaner')}</option>
                                 <option value="Driver">{t('vernacular.driver')}</option>
                             </select>
                         </div>


                         <div>
                             <label className={labelClasses}>{t('jobCreate.urgency')}</label>
                             <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} className={inputClasses}>
                                 <option value="low">{t('jobCreate.low')}</option>
                                 <option value="medium">{t('jobCreate.medium')}</option>
                                 <option value="high">{t('jobCreate.high')}</option>
                                 <option value="emergency">{t('jobCreate.emergency')}</option>
                             </select>
                         </div>

                         <div className="md:col-span-2">
                             <label className={labelClasses}>{t('jobCreate.skills')}</label>
                             <input type="text" value={form.skillsRequired} onChange={e => setForm({...form, skillsRequired: e.target.value})} className={inputClasses} placeholder={t('jobCreate.skills')} />
                         </div>

                         <div className="md:col-span-2">
                             <label className={labelClasses}>{t('jobCreate.tasks')}</label>
                             <textarea rows={4} value={form.tasks} onChange={e => setForm({...form, tasks: e.target.value})} className={inputClasses} placeholder={t('jobCreate.tasks')} />
                         </div>
                     </div>
                 </div>

                 {/* Budget & Schedule */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                     <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                         <DollarSign className="w-5 h-5 text-green-600"/> {t('jobCreate.budget')} & {t('jobCreate.schedule')}
                     </h3>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                             <label className={labelClasses}>{t('jobCreate.min')}</label>
                             <input type="number" value={form.budgetMin} onChange={e => setForm({...form, budgetMin: e.target.value})} className={inputClasses} placeholder="500" />
                        </div>
                        <div>
                             <label className={labelClasses}>{t('jobCreate.max')}</label>
                             <input type="number" value={form.budgetMax} onChange={e => setForm({...form, budgetMax: e.target.value})} className={inputClasses} placeholder="1500" />
                        </div>
                        <div>
                             <label className={labelClasses}>{t('jobCreate.hoursEst')}</label>
                             <div className="relative">
                                 <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                 <input type="number" value={form.hoursEstimate} onChange={e => setForm({...form, hoursEstimate: e.target.value})} className={clsx(inputClasses, "pl-10")} placeholder="2" />
                             </div>
                        </div>
                     </div>
                 </div>

                 {/* Location Map */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 overflow-hidden">
                     <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                         <MapPin className="w-5 h-5 text-red-500"/> {t('jobCreate.location')}
                     </h3>
                     
                     <div className="h-80 rounded-xl overflow-hidden border border-gray-200 relative z-0">
                         {loadingLocation ? (
                             <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                 <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                             </div>
                         ) : (
                             <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                                 <TileLayer
                                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                     attribution='&copy; OpenStreetMap'
                                 />
                                 <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                             </MapContainer>
                         )}
                         <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-md z-[1000] text-xs text-gray-500 font-medium border border-gray-200">
                             {t('jobCreate.dragMarker')}
                         </div>
                     </div>
                     <div className="mt-4 flex gap-4">
                         <div className="flex-1">
                            <label className={labelClasses}>Latitude</label>
                            <input type="text" readOnly value={form.lat} className={clsx(inputClasses, "bg-gray-100 text-gray-500")} />
                         </div>
                         <div className="flex-1">
                            <label className={labelClasses}>Longitude</label>
                            <input type="text" readOnly value={form.lng} className={clsx(inputClasses, "bg-gray-100 text-gray-500")} />
                         </div>
                     </div>
                 </div>

            </div>
         </div>
      </div>
    </div>
  );
}
