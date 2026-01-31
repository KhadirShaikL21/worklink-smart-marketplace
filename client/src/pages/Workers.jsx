import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Search, Filter, User, Briefcase, Star, IndianRupee, MapPin, Loader2 } from 'lucide-react';
import { WorkerCardSkeleton } from '../components/ui/Skeleton.jsx';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [skill, setSkill] = useState('');
  const [subSkill, setSubSkill] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = ['plumbing', 'electrical', 'carpentry', 'painting', 'cleaning', 'hvac', 'appliance'];
  const subSkillsByCategory = {
    plumbing: ['leak repair', 'pipe fitting', 'bathroom'],
    electrical: ['wiring', 'fan install', 'panel', 'lighting'],
    carpentry: ['furniture repair', 'modular', 'door'],
    painting: ['interior', 'exterior', 'waterproofing'],
    cleaning: ['deep clean', 'kitchen', 'sofa'],
    hvac: ['ac service', 'ac install'],
    appliance: ['fridge', 'washing machine', 'tv']
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Workers</h1>
          <p className="text-gray-500 mt-1">Browse skilled professionals for your needs</p>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search by name or skill"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={skill}
              onChange={e => { setSkill(e.target.value); setSubSkill(''); }}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            
            <select
              value={subSkill}
              onChange={e => setSubSkill(e.target.value)}
              disabled={!skill}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">All Sub-skills</option>
              {(subSkillsByCategory[skill] || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <button
              onClick={load}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
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
                          {worker.title || 'Worker'}
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
                        {skill}
                      </span>
                    ))}
                    {(worker.skills?.length || 0) > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{worker.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                  <span className={`text-xs font-medium flex items-center ${worker.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${worker.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {worker.isAvailable ? 'Available Now' : 'Busy / On Job'}
                  </span>
                  <Link 
                    to={`/profile/${worker.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Search className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
