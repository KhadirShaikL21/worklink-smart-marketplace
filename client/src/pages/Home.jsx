import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRight, Shield, Zap, Users, Search, Star, Award, CheckCircle, MapPin, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-24 h-24 text-primary-500 transform rotate-12 translate-x-4 -translate-y-4" />
    </div>
    <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <Icon className="h-7 w-7 text-primary-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

const StatCard = ({ number, label }) => (
  <div className="text-center">
    <div className="text-4xl font-bold text-primary-600 mb-2">{number}</div>
    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</div>
  </div>
);

const CategoryCard = ({ icon: Icon, title, count }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/workers?category=${title}`} className="group flex flex-col items-center p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-primary-50 transition-colors shadow-sm">
        <Icon className="w-8 h-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
      </div>
      <h3 className="font-bold text-gray-900 group-hover:text-primary-700 text-lg">{title}</h3>
      <span className="text-sm text-gray-500 mt-2 font-medium bg-gray-50 px-3 py-1 rounded-full text-center">
         {count === 'View All' ? t('home.categories.viewAll') : `${count} ${t('home.categories.professionals')}`}
      </span>
    </Link>
  );
};

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [topWorkers, setTopWorkers] = useState([]);
  
  // Dynamic gritty blue-collar action shots
  const heroImage1 = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop"; // Electrician actively wiring
  const heroImage2 = "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1000&auto=format&fit=crop"; // Welder with sparks flying
  const featureImage = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1000&auto=format&fit=crop"; // Mechanic under a car / heavy machinery


  useEffect(() => {
    const fetchTopWorkers = async () => {
      try {
        const res = await api.get('/api/workers/leaderboard?limit=3');
        setTopWorkers(res.data);
      } catch (err) {
        console.log('Leaderboard not available yet');
      }
    };
    fetchTopWorkers();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-white to-white opacity-70"></div>
        <div className="absolute top-0 right-0 -z-10 translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -z-10 -translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-secondary-100/30 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-primary-700 text-sm font-medium mb-8">
                <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2 animate-pulse"></span>
                {t('home.heroBadge')}
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-8 leading-[1.1]">
                {t('home.heroTitle')}
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg">
                {t('home.heroSubtitle')}
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                {user?.roles?.includes('worker') ? (
                  <Link to="/find-work" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-1">
                    {t('home.findWorkBtn')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <Link to="/jobs/new" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-1">
                    {t('home.postJobBtn')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
                
                <Link to="/workers" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all hover:-translate-y-1">
                  <Search className="mr-2 h-5 w-5 text-gray-500" />
                  {t('home.exploreProsBtn')}
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-12 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-gray-200 bg-[url('https://i.pravatar.cc/100?img=${i+10}')] bg-cover`}></div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600">+2k</div>
                </div>
                <div>
                  <div className="flex text-yellow-400 mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p>{t('home.trustedBy')}</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Image/Illustration */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block h-[600px]"
            >
               {/* Secondary Image (Behind) */}
               <div className="absolute top-20 left-0 w-2/3 h-[400px] z-0 transform -rotate-6 rounded-3xl overflow-hidden border-4 border-white shadow-xl opacity-90">
                  <img 
                    src={heroImage2} 
                    alt="Electrician working on panel" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-primary-900/10"></div>
               </div>

               {/* Main Image */}
               <div className="absolute top-0 right-0 w-3/4 z-10 p-2 rounded-3xl rotate-3 hover:rotate-0 transition-transform duration-500 origin-bottom-left">
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-3xl transform rotate-6 opacity-20 blur-lg"></div>
                 <img 
                   src={heroImage1} 
                   alt="Plumber Fixing Pipe" 
                   className="relative rounded-2xl w-full h-[450px] object-cover shadow-2xl border-4 border-white"
                 />
                 
                 {/* Floating Cards */}
                 <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute -left-12 top-24 bg-white p-4 rounded-xl shadow-xl border border-gray-100 max-w-[180px]"
                 >
                   <div className="flex items-center gap-3">
                     <div className="bg-green-100 p-2.5 rounded-lg shrink-0">
                       <Shield className="w-6 h-6 text-green-600" />
                     </div>
                     <div>
                       <p className="font-bold text-gray-900 text-sm">{t('home.verifiedBadge')}</p>
                       <p className="text-xs text-gray-500">{t('home.safeSecure')}</p>
                     </div>
                   </div>
                 </motion.div>

                 <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, delay: 1 }}
                    className="absolute -bottom-8 -right-4 bg-white p-5 rounded-xl shadow-xl border border-gray-100"
                 >
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-yellow-500 mb-1">
                           <span className="font-bold text-2xl text-gray-900">4.9</span>
                           <Star className="w-5 h-5 fill-current" />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('home.rating')}</p>
                      </div>
                      <div className="h-10 w-px bg-gray-100"></div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-primary-600 mb-1">
                           <span className="font-bold text-2xl">98%</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('home.success')}</p>
                      </div>
                    </div>
                 </motion.div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             <StatCard number="10k+" label={t('home.stats.jobsCompleted')} />
             <StatCard number="500+" label={t('home.stats.verifiedPros')} />
             <StatCard number="98%" label={t('home.stats.satisfaction')} />
             <StatCard number="24/7" label={t('home.stats.support')} />
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.popularServices')}</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t('home.popularServicesDesc')}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <CategoryCard icon={MapPin} title={t('home.categories.plumbing')} count="120+" />
            <CategoryCard icon={Zap} title={t('home.categories.electrical')} count="85+" />
            <CategoryCard icon={Shield} title={t('home.categories.cleaning')} count="200+" />
            <CategoryCard icon={Users} title={t('home.categories.moving')} count="50+" />
            <CategoryCard icon={Award} title={t('home.categories.painting')} count="90+" />
            <CategoryCard icon={Star} title={t('home.categories.more')} count="View All" />
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             
             {/* Left Content */}
             <div className="order-2 lg:order-1">
                <div className="mb-12">
                   <h2 className="text-4xl font-bold text-gray-900 mb-6">{t('home.featuresTitle')}</h2>
                   <p className="text-lg text-gray-600 leading-relaxed">
                     {t('home.featuresDesc')}
                   </p>
                </div>

                <div className="grid gap-6">
                  {/* Custom horizontal cards for this layout */}
                  <div className="flex gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="shrink-0 w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{t('home.feature1Title')}</h3>
                      <p className="text-gray-500 text-sm">{t('home.feature1Desc')}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="shrink-0 w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{t('home.feature2Title')}</h3>
                      <p className="text-gray-500 text-sm">{t('home.feature2Desc')}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="shrink-0 w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{t('home.feature3Title')}</h3>
                      <p className="text-gray-500 text-sm">{t('home.feature3Desc')}</p>
                    </div>
                  </div>
                </div>
             </div>

             {/* Right Image */}
             <div className="order-1 lg:order-2 relative">
                <div className="absolute inset-0 bg-primary-100 rounded-[3rem] transform rotate-3 scale-95 translate-y-4"></div>
                <img 
                  src={featureImage} 
                  alt="Skilled construction work" 
                  className="relative w-full h-[600px] object-cover rounded-[2.5rem] shadow-2xl"
                />
                
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl max-w-xs border border-gray-100 hidden sm:block">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-4">
                      <div className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 bg-[url('https://i.pravatar.cc/100?img=33')] bg-cover"></div>
                      <div className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 bg-[url('https://i.pravatar.cc/100?img=12')] bg-cover"></div>
                      <div className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 bg-[url('https://i.pravatar.cc/100?img=5')] bg-cover"></div>
                    </div>
                    <div>
                       <p className="font-bold text-gray-900">Join our team</p>
                       <p className="text-xs text-gray-500">Become a pro today</p>
                    </div>
                  </div>
                </div>
             </div>

          </div>
        </div>
      </section>

      {/* Top Workers Preview */}
      {topWorkers.length > 0 && (
        <section className="py-24 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Top Rated Professionals</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {topWorkers.map(worker => {
                const userName = worker.user?.name || 'Professional';
                const userAvatar = worker.user?.avatarUrl || worker.avatarUrl;
                const rating = worker.user?.ratingStats?.average || 0;
                
                return (
                <motion.div 
                  key={worker._id} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300"
                >
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                        {userAvatar ? (
                          <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-xl text-gray-400">{userName[0]}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{userName}</h4>
                        <div className="flex items-center gap-2 text-sm mt-1">
                           <div className="flex items-center text-yellow-500 font-bold bg-yellow-50 px-2 py-0.5 rounded-full">
                             <Star className="w-3.5 h-3.5 fill-current mr-1"/>
                             {rating > 0 ? rating.toFixed(1) : 'New'}
                           </div>
                           <span className="text-gray-400">•</span>
                           <span className="text-gray-500 font-medium">{worker.reputationPoints || 0} pts</span>
                        </div>
                      </div>
                   </div>
                   <div className="pl-[4.5rem]">
                     <div className="flex gap-2 flex-wrap mb-3">
                        {worker.skills?.slice(0,3).map(skill => (
                          <span key={skill} className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600 border border-gray-200">{t(`categories.${skill.toLowerCase()}`, skill)}</span>
                        ))}
                     </div>
                     <Link to={`/workers/${worker.user?._id || worker.user}`} className="text-primary-600 hover:text-primary-700 text-sm font-semibold inline-flex items-center group">
                       View Profile 
                       <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </Link>
                   </div>
                </motion.div>
                );
              })}
            </div>
            <div className="mt-12 text-center">
              <Link to="/workers" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                View All Professionals
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to get your to-do list done?</h2>
          <p className="text-xl text-primary-100 mb-10">Join thousands of satisfied usage and skilled professionals on WorkLink today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/find-work" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                Find Work
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            ) : (
              <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-primary-900 bg-white hover:bg-gray-100 transition-colors">
                Get Started Now
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>
            )}
            <Link to="/about" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl text-white border-2 border-primary-500 hover:bg-primary-800 transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}