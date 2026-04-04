import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Search, Filter, User, Briefcase, Star, IndianRupee, MapPin, Loader2, Calendar } from 'lucide-react';
import { WorkerCardSkeleton } from '../components/ui/Skeleton.jsx';
import { useTranslation } from 'react-i18next';
import NavigationHeader from '../components/NavigationHeader';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Workers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initCategory = searchParams.get('category') || '';
  
  const { t } = useTranslation();
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [skill, setSkill] = useState(initCategory);
  const [subSkill, setSubSkill] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Modal State
  const [bookingWorker, setBookingWorker] = useState(null);
  const [bookingForm, setBookingForm] = useState({ title: '', hoursEstimate: '1', budget: '500', urgency: 'medium' });
  const [bookingLoading, setBookingLoading] = useState(false);

  const categories = [
    'plumbing', 'electrical', 'carpentry', 'painting', 'cleaning', 'hvac', 'appliance', 
    'web_development', 'graphic_design', 'digital_marketing', 'handyman', 'moving', 'landscaping'
  ];
  const subSkillsByCategory = {
    plumbing: ['leak repair', 'pipe fitting', 'bathroom'],
    electrical: ['wiring', 'fan install', 'panel', 'lighting'],
    carpentry: ['furniture repair', 'modular', 'door'],
    painting: ['interior', 'exterior', 'waterproofing'],
    cleaning: ['deep clean', 'kitchen', 'sofa'],
    hvac: ['ac service', 'ac install'],
    appliance: ['fridge', 'washing machine', 'tv'],
    web_development: ['frontend', 'backend', 'fullstack', 'wordpress'],
    graphic_design: ['logo', 'ui_ux', 'illustration', 'branding'],
    digital_marketing: ['seo', 'social_media', 'content', 'ads'],
    handyman: ['general_repairs', 'assembly', 'mounting'],
    moving: ['packing', 'loading', 'relocation'],
    landscaping: ['gardening', 'lawn_mowing', 'design']
  };

  const handleDirectBook = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to book a service');
      navigate('/login');
      return;
    }
    setBookingLoading(true);
    try {
      if (!bookingWorker) return;
      // Call create job endpoint with assignedWorker
      await api.post('/api/jobs', {
        title: bookingForm.title,
        category: skill || 'General',
        hoursEstimate: bookingForm.hoursEstimate,
        budget: bookingForm.budget,
        urgency: bookingForm.urgency,
        assignedWorker: bookingWorker.user || bookingWorker.id,
        location: {
           type: 'Point',
           coordinates: [78.9629, 20.5937] // Default coordinates or grab from user
        }
      });
      toast.success(`Successfully directly booked ${bookingWorker.name || 'Worker'}!`);
      setBookingWorker(null);
      navigate('/jobs'); // Redirect to my jobs
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to directly book worker');
    } finally {
      setBookingLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/workers', { params: { skill: subSkill || skill, search } });
      setWorkers(res.data.workers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-search with debounce when search or skill changes
  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, skill, subSkill]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <NavigationHeader 
        title={t('workers.title')} 
        subtitle={t('workers.subtitle')}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: t('workers.title') }
        ]}
        showBack={true}
      />
      
      <div className="mt-8">
        {/* Search and Filter Bar */}
        <div className="w-full bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-2 mb-8">
          <div className="relative flex-grow md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg leading-5 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
              placeholder={t('workers.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          
          <div className="flex gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 pt-2 sm:pt-0 sm:pl-2">
            <select
              value={skill}
              onChange={e => { setSkill(e.target.value); setSubSkill(''); }}
              className="block w-full pl-3 pr-8 py-2 text-sm border-none bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-600 font-medium"
            >
              <option value="">{t('workers.allCategories')}</option>
              {categories.map(c => <option key={c} value={c}>{t(`categories.${c}`, c.charAt(0).toUpperCase() + c.slice(1))}</option>)}
            </select>
            
            <button
              onClick={load}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {t('workers.filter')}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Loader2 className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <WorkerCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.length > 0 ? (
            workers.map((worker) => (
              <div key={worker.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {worker.avatarUrl ? (
                          <img src={worker.avatarUrl} alt={worker.name} className="h-12 w-12 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                            <User className="h-6 w-6" />
                          </div>
                        )}
                        {worker.verification?.phoneVerified && (
                          <span className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 border-white" title="Verified">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{worker.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {worker.title ? t(`categories.${worker.title.toLowerCase()}`, worker.title) : t('workers.worker', 'Worker')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center text-yellow-400 text-sm font-medium">
                        <Star className="w-4 h-4 fill-current mr-1" />
                        <span>{worker.rating || 4.8}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center text-gray-700 font-medium mb-2">
                      <IndianRupee className="w-4 h-4 mr-1 text-gray-400" />
                      ₹{worker.hourlyRate || 0}/hr
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 h-10">
                      {worker.bio || 'No bio available.'}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(worker.skills || []).slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {t(`categories.${skill.toLowerCase()}`, skill)}
                      </span>
                    ))}
                    {(worker.skills?.length || 0) > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{worker.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2">
                  <span className={`text-xs font-medium flex items-center ${worker.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${worker.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {worker.isAvailable ? t('workers.available', 'Available') : t('workers.busy', 'Busy')}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/profile/${worker.id}`}
                      className="text-sm font-medium text-gray-600 hover:text-primary-700"
                    >
                      {t('workers.viewProfile', 'View Profile')}
                    </Link>
                    
                    <button
                       onClick={() => setBookingWorker(worker)}
                       disabled={!worker.isAvailable}
                       className="inline-flex items-center text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Calendar className="w-4 h-4 mr-1.5" />
                      {t('workers.bookService', 'Direct Book')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Search className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('workers.noWorkers', 'No workers found')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('workers.adjustFilters', 'Try adjusting your search or filters.')}</p>
            </div>
          )}
        </div>
      )}

      {/* Direct Booking Modal */}
      {bookingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('workers.directBookTitle', 'Direct Booking')} {bookingWorker.name}</h2>
            <form onSubmit={handleDirectBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('workers.serviceNeeded', 'Service Needed')}</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Fix leaking pipe"
                  value={bookingForm.title}
                  onChange={e => setBookingForm(f => ({...f, title: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('workers.hoursEst', 'Hours Estimate')}</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={bookingForm.hoursEstimate}
                    onChange={e => setBookingForm(f => ({...f, hoursEstimate: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('workers.budgetRs', 'Budget (₹)')}</label>
                  <input 
                    type="number" 
                    min="100"
                    required
                    value={bookingForm.budget}
                    onChange={e => setBookingForm(f => ({...f, budget: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('workers.urgency', 'Urgency')}</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  value={bookingForm.urgency}
                  onChange={e => setBookingForm(f => ({...f, urgency: e.target.value}))}
                >
                  <option value="low">Low - Within a week</option>
                  <option value="medium">Medium - Within 48 hours</option>
                  <option value="high">High - Immediately</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBookingWorker(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="inline-flex flex-1 justify-center items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-70 transition-colors"
                >
                  {bookingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
