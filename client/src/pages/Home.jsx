import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRight, Shield, Zap, Users, Search } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

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
              Find the perfect <span className="text-primary-600">worker</span> for your next job.
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              WorkLink connects skilled blue-collar professionals with employers using smart AI matching. Fair, fast, and reliable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user?.roles?.includes('worker') ? (
                <>
                  <Link to="/find-work" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                    Find Work
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/jobs/new" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                    Post a Job
                  </Link>
                </>
              ) : user?.roles?.includes('customer') ? (
                <>
                  <Link to="/jobs/new" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                    Post a Job
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/workers" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                    Hire Workers
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                    Find Work
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Matching</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI algorithm analyzes skills and requirements to match workers with jobs in seconds, not days.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-xl bg-secondary-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Profiles</h3>
              <p className="text-gray-600 leading-relaxed">
                Every worker is verified with background checks and skill assessments to ensure quality and trust.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fair Opportunities</h3>
              <p className="text-gray-600 leading-relaxed">
                We believe in equal access to work. Our platform ensures fair pay and transparent working conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

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
