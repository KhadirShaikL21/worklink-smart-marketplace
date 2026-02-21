import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRight, Shield, Zap, Users, Search, Star, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [topWorkers, setTopWorkers] = useState([]);

  useEffect(() => {
    const fetchTopWorkers = async () => {
      try {
        const res = await api.get('/api/workers/leaderboard?limit=3');
        setTopWorkers(res.data);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      }
    };
    fetchTopWorkers();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-100 via-white to-white"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-6 border border-primary-100">
              <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2"></span>
              AI-Powered Job Matching
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              {t('home.heroTitle')}
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user?.roles?.includes('worker') ? (
                <>
                  <Link to="/find-work" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                    {t('home.findWorkBtn')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/jobs/new" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                    {t('home.postJob')}
                  </Link>
                </>
              ) : user?.roles?.includes('customer') ? (
                <>
                  <Link to="/jobs/new" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                    {t('home.postJob')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/workers" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                    Hire Workers
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                    {t('home.findWorkBtn')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                    Hire Workers
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('home.step1Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
               {t('home.step1Desc')}
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-xl bg-secondary-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('home.step2Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.step2Desc')}
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t('home.step3Title')}</h3>
              <p className="text-gray-600 leading-relaxed">
               {t('home.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Workers Leaderboard */}
      {topWorkers.length > 0 && (
        <section className="py-24 relative overflow-hidden bg-gray-50/50">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-50/50 via-gray-50/50 to-white/50"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Rated Professionals</h2>
              <p className="text-gray-500">Meet our community heroes who consistently deliver excellence and reliability.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topWorkers.map((worker, i) => (
                <div key={worker._id || i} className="block relative">
                <Link to={`/profile/${worker.user?._id}`} className="block bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group h-full">
                  {i === 0 && (
                    <div className="absolute -top-3 -right-3 bg-yellow-400 text-white p-2 rounded-full shadow-lg z-10 animate-pulse">
                      <Award className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-100">
                        <img 
                          src={worker.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.user?.name || 'User')}&background=random`} 
                          alt={worker.user?.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{worker.user?.name}</h3>
                      <p className="text-sm text-gray-500">{worker.title || 'Skilled Worker'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
                      <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="font-bold text-gray-900">{(worker.reputationPoints || 0) > 0 ? (worker.reputationPoints / 100).toFixed(1) : 'New'}</span>
                    </div>
                    <span className="text-gray-500">{worker.completedJobs} jobs done</span>
                  </div>

                  {worker.badges?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                       {worker.badges.slice(0, 3).map((badge, idx) => (
                         <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600" title={badge.name}>
                           {badge.icon} {badge.name}
                         </span>
                       ))}
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      {worker.skills?.slice(0, 2).map((skill, idx) => (
                         <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                           {skill}
                         </span>
                      ))}
                    </div>
                  )}
                </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-400 mb-10">
            Join thousands of workers and employers building the future of blue-collar work today.
          </p>
          <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-lg text-gray-900 bg-secondary-500 hover:bg-secondary-400 transition-colors shadow-lg shadow-secondary-500/20">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
