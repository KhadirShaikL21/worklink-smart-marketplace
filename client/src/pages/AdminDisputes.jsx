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

  const [resolveModal, setResolveModal] = useState({ isOpen: false, jobId: null, type: 'dismiss', note: '' });

  useEffect(() => {
    if (user?.roles.includes('admin')) {
        fetchDisputes();
    }
  }, [user]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      // Fetch open disputes
      const res = await api.get('/api/admin/disputes?status=open');
       if (res.data && res.data.disputes) {
          setDisputes(res.data.disputes);
       } else {
          setDisputes([]);
       }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const openResolveModal = (jobId) => {
      setResolveModal({ isOpen: true, jobId, type: 'dismiss', note: '' });
  };

  const submitResolution = async () => {
    if (!resolveModal.type) return alert('Select a resolution type');
    
    setResolving(true);
    try {
      await api.post(`/api/admin/disputes/${resolveModal.jobId}/resolve`, { 
          resolution: resolveModal.type, 
          adminNote: resolveModal.note 
      });
      // Remove from list
      setDisputes(prev => prev.filter(d => d.id !== resolveModal.jobId));
      setResolveModal({ isOpen: false, jobId: null, type: 'dismiss', note: '' });
      alert(`Dispute resolved successfully!`);
    } catch (err) {
      alert(`Error resolving dispute: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto"/> Loading disputes...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Resolve Modal */}
        {resolveModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Resolve Dispute</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Action</label>
                            <select 
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500"
                                value={resolveModal.type}
                                onChange={(e) => setResolveModal({ ...resolveModal, type: e.target.value })}
                            >
                                <option value="dismiss">Dismiss (Resume Job)</option>
                                <option value="refund">Refund Customer (Cancel Job)</option>
                                <option value="release">Release Payment to Worker (Complete Job)</option>
                                <option value="cancel_no_refund">Cancel Job (No Refund/Forfeit)</option>
                                <option value="reassign">Reassign Worker (Remove Worker & Reopen)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {resolveModal.type === 'dismiss' && "Job continues as normal."}
                                {resolveModal.type === 'refund' && "Money returned to customer. Job cancelled."}
                                {resolveModal.type === 'release' && "Money sent to worker. Job marked complete."}
                                {resolveModal.type === 'cancel_no_refund' && "Job cancelled. Money stays on platform/held."}
                                {resolveModal.type === 'reassign' && "Current worker removed. Job opens for new applications."}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (Required)</label>
                            <textarea 
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500 h-24"
                                placeholder="Explain the reason for this decision..."
                                value={resolveModal.note}
                                onChange={(e) => setResolveModal({ ...resolveModal, note: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            onClick={() => setResolveModal({ isOpen: false, jobId: null })}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={submitResolution}
                            disabled={resolving || !resolveModal.note}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                            {resolving ? 'Processing...' : 'Confirm Resolution'}
                        </button>
                    </div>
                </div>
            </div>
        )}

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
                     onClick={() => setResolveModal({ isOpen: true, jobId: dispute.id, type: 'dismiss', note: '' })}
                     className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-sm transition-colors"
                   >
                     Resolve Dispute
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
