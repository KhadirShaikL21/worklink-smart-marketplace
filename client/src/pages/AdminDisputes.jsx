import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Loader2, AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDisputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      // Fetch open disputes
      const res = await api.get('/api/admin/disputes?status=open');
      setDisputes(res.data.disputes);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (jobId, resolution, note = '') => {
    if (!window.confirm(`Are you sure you want to ${resolution} this dispute?`)) return;

    setResolving(true);
    try {
      await api.post(`/api/admin/disputes/${jobId}/resolve`, { resolution, adminNote: note });
      // Remove from list
      setDisputes(prev => prev.filter(d => d.id !== jobId));
      alert(`Dispute ${resolution} successfully!`);
    } catch (err) {
      alert(`Error resolving dispute: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto"/> Loading disputes...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-orange-500"/> 
          Dispute Resolution Center
        </h1>
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
           <Shield className="w-16 h-16 text-green-200 mx-auto mb-4"/>
           <h3 className="text-lg font-medium text-gray-900">No Open Disputes</h3>
           <p className="text-gray-500">Everything looks good! No active disputes requiring your attention.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {disputes.map(dispute => (
            <div key={dispute.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{dispute.jobTitle}</h3>
                    <p className="text-sm text-gray-500">Job ID: {dispute.id}</p>
                  </div>
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                    {dispute.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                   <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Dispute Details</h4>
                      <p className="text-sm text-gray-800 font-medium mb-1">
                        Raised By: <span className="font-normal">{dispute.raisedBy?.name} ({dispute.raisedBy?.email})</span>
                      </p>
                      <p className="text-sm text-gray-800 font-medium mb-1">
                        Reason: <span className="font-normal">{dispute.reason}</span>
                      </p>
                      <p className="text-sm text-gray-600 italic bg-white p-3 rounded border border-gray-200 mt-2">
                        "{dispute.description}"
                      </p>
                   </div>
                   
                   <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Parties Involved</h4>
                      <div className="flex items-center gap-4 mb-3">
                         <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">CUST</div>
                         <div className="text-sm">
                            <p className="font-medium text-gray-900">{dispute.customer?.name}</p>
                            <p className="text-gray-500">{dispute.customer?.email}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">WORK</div>
                         <div className="text-sm">
                            <p className="font-medium text-gray-900">{dispute.worker?.name}</p>
                            <p className="text-gray-500">{dispute.worker?.email}</p>
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="border-t border-gray-100 pt-6 flex flex-wrap gap-4 justify-end">
                   <button 
                     onClick={() => handleResolve(dispute.id, 'refund')}
                     disabled={resolving}
                     className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors"
                   >
                     <XCircle className="w-4 h-4" />
                     Refund Customer (Cancel Job)
                   </button>
                   <button 
                     onClick={() => handleResolve(dispute.id, 'dismiss')}
                     disabled={resolving}
                     className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                   >
                     Dismiss (Resume Job)
                   </button>
                   <button 
                     onClick={() => handleResolve(dispute.id, 'release')}
                     disabled={resolving}
                     className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm transition-colors"
                   >
                     <CheckCircle className="w-4 h-4" />
                     Release Payment (Complete Job)
                   </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
