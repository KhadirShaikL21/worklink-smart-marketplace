import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Wallet, CreditCard, Landmark, History, AlertCircle, CheckCircle, Clock, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function WalletPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, released: 0 });
  const [transactions, setTransactions] = useState([]);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    upiId: ''
  });
  const [savingBank, setSavingBank] = useState(false);
  const [message, setMessage] = useState(null);

  // Ensure only workers can access this page
  if (!user?.roles?.includes('worker')) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-gray-500 px-4">
        <Wallet className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium">{t('wallet.workersOnly') || 'This page is only available for workers'}</p>
        <p className="text-sm text-gray-400 mt-2">You need to switch to a worker account to access the wallet.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        setLoading(true);
        // We use Promise.allSettled so one failure doesn't block the other
        const results = await Promise.allSettled([
          api.get('/api/payments/worker-stats'),
          api.get('/api/auth/me') 
        ]);
        
        const statsRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const userRes = results[1].status === 'fulfilled' ? results[1].value : null;

        if(statsRes && statsRes.data) {
           setStats(statsRes.data.stats || { total: 0, pending: 0, released: 0 });
           setTransactions(statsRes.data.recentTransactions || []);
        }
        
        if (userRes && userRes.data && userRes.data.user && userRes.data.user.bankDetails) {
          setBankDetails(prev => ({ ...prev, ...userRes.data.user.bankDetails }));
        }
    } catch (error) {
      console.error('Failed to fetch wallet data', error);
      setMessage({ type: 'error', text: t('common.errorLoadingData') || 'Failed to load wallet data' });
    } finally {
      setLoading(false);
    }
  };

  const handleBankChange = (e) => {
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const saveBankDetails = async (e) => {
    e.preventDefault();
    setSavingBank(true);
    setMessage(null);
    try {
      await api.patch('/api/auth/me', { bankDetails });
      setMessage({ type: 'success', text: t('wallet.bankDetailsSaved') || 'Bank details saved successfully' });
      // Fetch latest data to ensure sync
      const res = await api.get('/api/auth/me');
      if (res.data.user.bankDetails) {
          setBankDetails(prev => ({ ...prev, ...res.data.user.bankDetails }));
      }
    } catch (error) {
      console.error('Save bank details failed', error);
      setMessage({ type: 'error', text: t('common.errorSavingData') || 'Failed to save bank details' });
    } finally {
      setSavingBank(false);
    }
  };

  // Calculate generic weekly data for visual purposes
  const weeklyChartData = useMemo(() => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const last7Days = [];
      
      for(let i=6; i>=0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dayName = days[d.getDay()];
          // Filter transactions for this day
          const dayTotal = transactions
            .filter(t => new Date(t.date).toDateString() === d.toDateString() && t.status === 'released')
            .reduce((acc, curr) => acc + curr.amount, 0);
          
          last7Days.push({ day: dayName, amount: dayTotal, fullDate: d });
      }
      return last7Days;
  }, [transactions]);
  
  const maxChartValue = Math.max(...weeklyChartData.map(d => d.amount), 100); // Default to 100 to avoid div by zero

  if (loading) return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
  );

  return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Wallet className="w-8 h-8 text-primary-600" />
          </div>
          {t('wallet.title') || 'My Wallet'}
        </h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 animate-fadeIn ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Earnings Overview & Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
           {/* Chart Section */}
           <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                        {t('wallet.weeklyEarnings') || 'Weekly Earnings'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">Last 7 days performance</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">This Week</p>
                    <p className="text-2xl font-bold text-gray-900">
                        ₹{weeklyChartData.reduce((a,b) => a + b.amount, 0).toLocaleString()}
                    </p>
                 </div>
              </div>
              
              {/* CSS Bar Chart */}
              <div className="flex items-end justify-between h-40 gap-2 sm:gap-4 mt-4">
                  {weeklyChartData.map((item, index) => (
                      <div key={index} className="flex flex-col items-center flex-1 group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              ₹{item.amount}
                          </div>
                          
                          <div className="w-full bg-gray-100 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-full">
                              <div 
                                style={{ height: `${(item.amount / maxChartValue) * 100}%` }} 
                                className={`w-full transition-all duration-700 ease-out ${item.amount > 0 ? 'bg-primary-500 group-hover:bg-primary-600' : 'bg-transparent'}`}
                              ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-2 font-medium">{item.day}</span>
                      </div>
                  ))}
              </div>
           </div>

           {/* Stats Cards Column */}
           <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-primary-900/20 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12">
                    <Wallet className="w-32 h-32" />
                </div>
                <p className="text-primary-100 font-medium mb-1 text-sm uppercase tracking-wide">{t('wallet.currentBalance') || 'Wallet Balance'}</p>
                <h3 className="text-4xl font-bold mb-2">₹{(stats.currentBalance !== undefined ? stats.currentBalance : stats.released).toLocaleString()}</h3>
                <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                    <CheckCircle className="w-3 h-3" />
                    <span>Available to Withdraw</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1">
                 <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center mb-3">
                        <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase">{t('wallet.pending') || 'Pending'}</p>
                    <h3 className="text-xl font-bold text-gray-900">₹{stats.pending.toLocaleString()}</h3>
                 </div>
                 <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase">{t('wallet.totalEarned') || 'Total Earned'}</p>
                    <h3 className="text-xl font-bold text-gray-900">₹{stats.released.toLocaleString()}</h3>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
              <History className="w-5 h-5 text-gray-500" />
              {t('wallet.recentTransactions') || 'Recent Transactions'}
            </h2>
            
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                  <History className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">{t('wallet.noTransactions') || 'No transactions yet.'}</p>
                <p className="text-gray-400 text-sm mt-1">Complete jobs to start earning.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map(tx => (
                  <div key={tx._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                    <div className="mb-2 sm:mb-0">
                      <p className="font-semibold text-gray-800 text-lg">{tx.jobTitle}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{new Date(tx.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{tx.payerName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${
                        tx.status === 'released' ? 'bg-green-100 text-green-800' : 
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tx.status}
                      </span>
                      <p className={`font-bold text-lg ${
                        tx.status === 'released' ? 'text-green-600' : 
                        tx.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        +₹{tx.amount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bank Account Settings */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
              <CreditCard className="w-5 h-5 text-gray-500" />
              {t('wallet.payoutSettings') || 'Payout Details'}
            </h2>
            
            <form onSubmit={saveBankDetails} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('wallet.accountHolderName') || 'Account Holder Name'}
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={bankDetails.accountHolderName}
                  onChange={handleBankChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('wallet.bankName') || 'Bank Name'}
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={bankDetails.bankName}
                  onChange={handleBankChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="e.g. State Bank of India"
                />
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('wallet.accountNumber') || 'Account Number'}
                  </label>
                  <input
                    type="password"
                    name="accountNumber"
                    value={bankDetails.accountNumber}
                    onChange={handleBankChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="************"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('wallet.ifscCode') || 'IFSC Code'}
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={bankDetails.ifscCode}
                    onChange={handleBankChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="SBIN0001234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('wallet.upiId') || 'UPI ID'}
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={bankDetails.upiId}
                    onChange={handleBankChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    placeholder="user@upi"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={savingBank}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {savingBank ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    t('common.saveChanges') || 'Save Changes'
                  )}
                </button>
                <p className="mt-4 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {t('wallet.secureNote') || 'Encrypted & Secure. Powered by Stripe Connect.'}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}
