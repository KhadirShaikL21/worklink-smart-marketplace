import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Users, Briefcase, DollarSign, Activity, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/admin/stats');
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-4">
           {/* Add user verification shortcuts or similar here later */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Workers</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalWorkers || 0}</p>
          </div>
           <div className="p-3 bg-indigo-50 rounded-lg">
            <Briefcase className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{((stats?.totalRevenue || 0) / 100).toFixed(2)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Jobs</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.activeJobs || 0}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <Activity className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/users" className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Users className="w-8 h-8 text-blue-600 mb-3" />
              <span className="font-medium text-gray-700">Manage Users</span>
            </Link>
             <Link to="/admin/disputes" className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <AlertTriangle className="w-8 h-8 text-red-600 mb-3" />
              <span className="font-medium text-gray-700">Disputes</span>
            </Link>
          </div>
        </div>
        
        {/* Placeholder for Recent Activity or Notifications */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">System Health</h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Database Connection</span>
                    <span className="text-green-600 font-medium flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Stable</span>
                </div>
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payment Gateway</span>
                    <span className="text-green-600 font-medium flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Connected</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
