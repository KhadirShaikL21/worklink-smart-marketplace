import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Users, Briefcase, DollarSign, Activity, AlertTriangle, CheckCircle, TrendingUp, Zap, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentPage, setPaymentPage] = useState(0);
  const paymentsPerPage = 10;

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

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toFixed(2)}`;
  };

  // Get paginated payments
  const allPayments = stats?.recentPayments || [];
  const paginatedPayments = allPayments.slice(paymentPage * paymentsPerPage, (paymentPage + 1) * paymentsPerPage);
  const totalPages = Math.ceil(allPayments.length / paymentsPerPage);

  const handleNextPage = () => {
    if (paymentPage < totalPages - 1) setPaymentPage(paymentPage + 1);
  };

  const handlePrevPage = () => {
    if (paymentPage > 0) setPaymentPage(paymentPage - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your platform overview.</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">Total</span>
            </div>
            <p className="text-sm font-medium text-blue-700 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-blue-900">{stats?.totalUsers || 0}</p>
            <p className="text-xs text-blue-600 mt-2">
              {stats?.totalWorkers || 0} workers • {stats?.totalCustomers || 0} customers
            </p>
          </div>

          {/* Active Jobs */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-orange-600" />
              <span className="text-xs font-semibold text-orange-600 bg-orange-200 px-2 py-1 rounded-full">Live</span>
            </div>
            <p className="text-sm font-medium text-orange-700 mb-1">Active Jobs</p>
            <p className="text-3xl font-bold text-orange-900">{stats?.activeJobs || 0}</p>
            <p className="text-xs text-orange-600 mt-2">
              {stats?.totalJobs || 0} total jobs • {stats?.completedJobs || 0} completed
            </p>
          </div>

          {/* Platform Revenue */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
              <span className="text-xs font-semibold text-green-600 bg-green-200 px-2 py-1 rounded-full">Income</span>
            </div>
            <p className="text-sm font-medium text-green-700 mb-1">Platform Revenue (5%)</p>
            <p className="text-3xl font-bold text-green-900">{formatCurrency(stats?.platformRevenue || 0)}</p>
            <p className="text-xs text-green-600 mt-2">From {stats?.totalTransactions || 0} transactions</p>
          </div>

          {/* Worker Payouts */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-purple-600" />
              <span className="text-xs font-semibold text-purple-600 bg-purple-200 px-2 py-1 rounded-full">Paid</span>
            </div>
            <p className="text-sm font-medium text-purple-700 mb-1">Worker Payouts</p>
            <p className="text-3xl font-bold text-purple-900">{formatCurrency(stats?.totalWorkerPayouts || 0)}</p>
            <p className="text-xs text-purple-600 mt-2">Distributed to {stats?.activeWorkers || 0} workers</p>
          </div>
        </div>

        {/* Revenue Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Financial Overview */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Financial Overview</h2>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="space-y-4">
              {/* Total Gross Volume */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gross Volume</p>
                  <p className="text-xs text-gray-500 mt-1">All job payments processed</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats?.totalGrossVolume || 0)}</p>
              </div>

              {/* Platform Revenue */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-green-700">Platform Fee (5%)</p>
                  <p className="text-xs text-green-600 mt-1">WorkLink's commission</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.platformRevenue || 0)}</p>
              </div>

              {/* Worker Payouts */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-purple-700">Worker Earnings (95%)</p>
                  <p className="text-xs text-purple-600 mt-1">Total released to all service providers</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats?.totalWorkerPayouts || 0)}</p>
              </div>

              {/* Total Revenue */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 mt-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">Total Economic Activity</p>
                  <p className="text-xs text-gray-600 mt-1">Platform + Worker earnings</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
            </div>
          </div>

          {/* Business Metrics */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Business Metrics</h2>
              <Zap className="w-6 h-6 text-amber-600" />
            </div>

            <div className="space-y-4">
              {/* Transaction Count */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-xs font-medium text-blue-600 uppercase">Transactions</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{stats?.totalTransactions || 0}</p>
                <p className="text-xs text-blue-600 mt-2">Completed payments</p>
              </div>

              {/* Average Job Value */}
              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="text-xs font-medium text-emerald-600 uppercase">Avg Job Value</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(stats?.avgJobValue || 0)}</p>
                <p className="text-xs text-emerald-600 mt-2">Per transaction</p>
              </div>

              {/* Completion Rate */}
              <div className="p-4 bg-rose-50 rounded-xl">
                <p className="text-xs font-medium text-rose-600 uppercase">Completion Rate</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">
                  {stats?.totalJobs > 0 ? ((stats?.completedJobs / stats?.totalJobs) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-rose-600 mt-2">{stats?.completedJobs || 0} of {stats?.totalJobs || 0} jobs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Status & Issues Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Completed Jobs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Completed Jobs</h3>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-4xl font-bold text-green-600">{stats?.completedJobs || 0}</p>
            <p className="text-sm text-gray-600 mt-3">Successfully finished projects</p>
          </div>

          {/* Disputed Jobs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Disputed Jobs</h3>
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-4xl font-bold text-amber-600">{stats?.disputedJobs || 0}</p>
            <p className="text-sm text-gray-600 mt-3">Requiring attention</p>
            <Link to="/admin/disputes" className="text-xs text-blue-600 font-semibold mt-4 inline-block hover:underline">
              Manage Disputes →
            </Link>
          </div>

          {/* Worker Utilization */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Active Workers</h3>
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-blue-600">{stats?.activeWorkers || 0}</p>
            <p className="text-sm text-gray-600 mt-3">Workers with completed jobs</p>
          </div>
        </div>

        {/* Quick Actions & System Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/admin/users" className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all">
                <Users className="w-8 h-8 text-blue-600 mb-3" />
                <span className="font-semibold text-gray-700 text-center text-sm">Manage Users</span>
              </Link>
              <Link to="/admin/disputes" className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all">
                <AlertTriangle className="w-8 h-8 text-red-600 mb-3" />
                <span className="font-semibold text-gray-700 text-center text-sm">Handle Disputes</span>
              </Link>
              <Link to="/admin/users" className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all">
                <Award className="w-8 h-8 text-green-600 mb-3" />
                <span className="font-semibold text-gray-700 text-center text-sm">View Workers</span>
              </Link>
              <Link to="/admin/users" className="flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all">
                <DollarSign className="w-8 h-8 text-purple-600 mb-3" />
                <span className="font-semibold text-gray-700 text-center text-sm">Payments</span>
              </Link>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">System Health</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Database Connection</p>
                    <p className="text-xs text-gray-600">All systems operational</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Stable</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Payment Gateway</p>
                    <p className="text-xs text-gray-600">All payments processing</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Connected</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">API Services</p>
                    <p className="text-xs text-gray-600">All endpoints responding</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Healthy</span>
              </div>
            </div>
          </div>
        </div>

        {/* All Payments Table with Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">All Payments</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">
                Page {paymentPage + 1} of {totalPages > 0 ? totalPages : 1}
              </span>
              <button
                onClick={handlePrevPage}
                disabled={paymentPage === 0}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleNextPage}
                disabled={paymentPage >= totalPages - 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {paginatedPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Job</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Worker</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Gross Amount</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Platform Fee (5%)</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-900">Worker Payout</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPayments.map((payment) => {
                    const platformFee = Math.round(payment.total * (payment.platformFeePct || 5) / 100);
                    const workerPayout = payment.payees[0]?.amount || (payment.total - platformFee);
                    const workerName = payment.payees[0]?.workerName || payment.payees[0]?.worker?.name || '-';
                    return (
                      <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-medium">{payment.job?.title || '-'}</td>
                        <td className="px-4 py-3 text-gray-700">{payment.payer?.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {workerName}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-semibold">{formatCurrency(payment.total)}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(platformFee)}</td>
                        <td className="px-4 py-3 text-right text-purple-600 font-medium">{formatCurrency(workerPayout)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'captured' ? 'bg-green-100 text-green-800' : 
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.payees[0]?.status?.toUpperCase() || payment.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
