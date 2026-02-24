import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Loader2, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Clock, 
  User, 
  DollarSign, 
  Gavel,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const DisputeCard = ({ dispute, onResolve, onExpand, expanded }) => {
  const isExpanded = expanded === dispute._id;
  
  const priorities = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  // Safe checks for nested properties since schema change might have mixed data
  const disputeData = dispute.dispute || {};
  const customer = dispute.customer || {};
  const worker = dispute.worker || (dispute.assignedWorkers && dispute.assignedWorkers[0]) || {};

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary-500 shadow-md' : 'border-gray-200 hover:border-primary-300'}`}
    >
      <div className="p-5 cursor-pointer" onClick={() => onExpand(isExpanded ? null : dispute._id)}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorities[disputeData.priority || 'medium']}`}>
                {disputeData.priority?.toUpperCase() || 'MEDIUM'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[disputeData.status || 'open']}`}>
                {disputeData.status?.toUpperCase() || 'OPEN'}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(disputeData.createdAt || dispute.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {dispute.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="font-medium text-gray-900">Category:</span> {disputeData.category || 'General'} 
              {disputeData.subCategory && <span className="text-gray-400">•</span>}
              {disputeData.subCategory}
            </div>
            <p className="text-gray-600 text-sm line-clamp-2">
              {disputeData.description || disputeData.reason || "No description provided."}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {dispute.budget?.min && dispute.budget?.max 
                  ? `${dispute.budget.currency || '$'}${dispute.budget.min}-${dispute.budget.max}` 
                  : `${dispute.budget?.currency || '$'}${dispute.budget?.min || dispute.budget || 0}`}
              </div>
              <div className="text-xs text-gray-500">Disputed Amount</div>
            </div>
             <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-gray-50"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Details */}
              <div className="space-y-6 md:col-span-2">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary-600" />
                    Description & Evidence
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mb-4">
                    {disputeData.description || disputeData.reason || "No description provided."}
                  </p>
                  
                  {/* History Timeline */}
                  <div className="mt-6">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Case History</h5>
                    <div className="space-y-4 relative pl-4 border-l-2 border-gray-200">
                       {disputeData.history && disputeData.history.map((h, i) => (
                           <div key={i} className="relative">
                               <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${h.action === 'created' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                               <div className="text-sm">
                                   <span className="font-medium text-gray-900">{h.action === 'created' ? 'Dispute Raised' : h.action}</span>
                                   <span className="text-gray-500 text-xs ml-2">{new Date(h.timestamp).toLocaleString()}</span>
                               </div>
                               {h.note && <p className="text-gray-600 text-xs mt-1 bg-white p-2 rounded border border-gray-100">{h.note}</p>}
                           </div>
                       ))}
                       {(!disputeData.history || disputeData.history.length === 0) && (
                           <div className="text-xs text-gray-500 italic">No history available</div>
                       )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right User Info & Actions */}
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary-600" />
                        Parties Involved
                    </h4>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Customer (Raised By)</div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                    {customer.name?.[0] || 'C'}
                                </div>
                                {customer.name || 'Unknown'}
                            </div>
                        </div>
                        <div className="h-px bg-gray-100" />
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Worker</div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                                    {worker.name?.[0] || 'W'}
                                </div>
                                {worker.name || 'Unknown'}
                            </div>
                        </div>
                    </div>
                </div>

                {disputeData.status === 'open' && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Gavel className="w-4 h-4 text-primary-600" />
                            Admin Actions
                        </h4>
                        <div className="space-y-2">
                            <button 
                                onClick={() => onResolve(dispute._id, 'dismiss')}
                                className="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4 text-gray-500" /> Dismiss & Resume
                            </button>
                             <button 
                                onClick={() => onResolve(dispute._id, 'refund')}
                                className="w-full py-2 px-3 text-sm border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-left flex items-center gap-2"
                            >
                                <DollarSign className="w-4 h-4" /> Refund Customer
                            </button>
                             <button 
                                onClick={() => onResolve(dispute._id, 'release')}
                                className="w-full py-2 px-3 text-sm border border-green-200 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-left flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Release to Worker
                            </button>
                            <button 
                                onClick={() => onResolve(dispute._id, 'reassign_discount')}
                                className="w-full py-2 px-3 text-sm border border-purple-200 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-left flex items-center gap-2"
                            >
                                <User className="w-4 h-4" /> Reassign & 25-50% Discount
                            </button>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function AdminDisputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showResolved, setShowResolved] = useState(false);

  // Resolution Modal State
  const [resolveModal, setResolveModal] = useState({ 
    isOpen: false, 
    jobId: null, 
    jobTitle: '',
    type: 'dismiss', 
    note: '' 
  });
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      // Typically fetch all disputes for admin, maybe filter by status in UI
      const res = await api.get('/api/admin/disputes');
      if (res.data && res.data.disputes) {
        setDisputes(res.data.disputes);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolveProps = (jobId, type) => {
    const job = disputes.find(d => d._id === jobId);
    setResolveModal({
        isOpen: true,
        jobId,
        jobTitle: job?.title,
        type,
        note: ''
    });
  };

  const submitResolution = async () => {
    if (!resolveModal.note.trim()) return alert('Please add an admin note explaining the resolution.');
    setResolving(true);
    try {
        await api.post(`/api/admin/disputes/${resolveModal.jobId}/resolve`, {
            resolution: resolveModal.type,
            adminNote: resolveModal.note
        });

        // Optimistic Update
        setDisputes(prev => prev.map(d => {
            if (d._id === resolveModal.jobId) {
                return { 
                    ...d, 
                    dispute: { 
                        ...d.dispute, 
                        status: 'resolved',
                        resolution: {
                            outcome: resolveModal.type,
                            resolvedAt: new Date(),
                            adminNote: resolveModal.note,
                            resolvedBy: user._id
                        },
                        history: [
                          ...(d.dispute.history || []),
                          {
                            action: 'resolved',
                            timestamp: new Date(),
                            note: `Resolved by Admin: ${resolveModal.type} - ${resolveModal.note}`
                          }
                        ]
                    } 
                };
            }
            return d;
        }));
        
        setResolveModal({ isOpen: false, jobId: null, type: 'dismiss', note: '' });
    } catch (err) {
        console.error(err);
        alert('Failed to resolve dispute');
    } finally {
        setResolving(false);
    }
  };

  // Stats
  const openCount = disputes.filter(d => d.dispute?.status === 'open').length;
  const resolvedCount = disputes.filter(d => d.dispute?.status === 'resolved').length;
  const highPriorityCount = disputes.filter(d => d.dispute?.status === 'open' && d.dispute?.priority === 'high').length;

  const filteredDisputes = disputes.filter(d => {
    if (showResolved) return d.dispute?.status === 'resolved';
    return d.dispute?.status === 'open';
  });

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Loading Dispute Center...</h2>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispute Resolution Platform</h1>
        <p className="text-gray-500">Manage and resolve conflicts between customers and workers with precision.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Open Disputes</p>
                <div className="text-3xl font-bold text-gray-900">{openCount}</div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                <AlertTriangle className="w-6 h-6" />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">High Priority</p>
                <div className="text-3xl font-bold text-red-600">{highPriorityCount}</div>
            </div>
            <div className="p-3 bg-red-100 rounded-full text-red-600">
                <Shield className="w-6 h-6" />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Resolved (Total)</p>
                <div className="text-3xl font-bold text-green-600">{resolvedCount}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
                <CheckCircle className="w-6 h-6" />
            </div>
        </div>
      </div>

      {/* Filters & List */}
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {showResolved ? 'Resolved Disputes' : 'Active Disputes'}
              </h2>
              <div className="flex gap-2">
                 <button 
                  onClick={() => setShowResolved(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${!showResolved ? 'bg-black text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                 >
                    Active
                 </button>
                 <button 
                  onClick={() => setShowResolved(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${showResolved ? 'bg-black text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                 >
                    Resolved
                 </button>
              </div>
          </div>

          <div className="space-y-4">
              {filteredDisputes.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No {showResolved ? 'Resolved' : 'Active'} Disputes</h3>
                      <p className="text-gray-500">There are no {showResolved ? 'resolved' : 'pending'} disputes to display.</p>
                  </div>
              ) : (
                  filteredDisputes.map(dispute => (
                      <DisputeCard 
                        key={dispute._id} 
                        dispute={dispute} 
                        expanded={expandedId}
                        onExpand={setExpandedId}
                        onResolve={handleOpenResolveProps}
                      />
                  ))
              )}
          </div>
      </div>

      {/* Resolution Modal */}
      <AnimatePresence>
        {resolveModal.isOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">Confirm Resolution</h3>
                        <button onClick={() => setResolveModal({...resolveModal, isOpen: false})} className="p-1 hover:bg-gray-100 rounded-full">
                            <XCircle className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        <div className="mb-6">
                            <div className="text-sm text-gray-500 mb-1">Action</div>
                            <div className="text-lg font-semibold capitalize flex items-center gap-2">
                                {resolveModal.type === 'refund' && <DollarSign className="w-5 h-5 text-red-500"/>}
                                {resolveModal.type === 'release' && <CheckCircle className="w-5 h-5 text-green-500"/>}
                                {resolveModal.type === 'dismiss' && <XCircle className="w-5 h-5 text-gray-500"/>}
                                {resolveModal.type === 'reassign_discount' && <User className="w-5 h-5 text-purple-500"/>}
                                {resolveModal.type === 'refund' ? 'Full Refund to Customer' : 
                                 resolveModal.type === 'release' ? 'Release Payment to Worker' : 
                                 resolveModal.type === 'reassign_discount' ? 'Reassign with Discount' :
                                 'Dismiss Dispute & Resume Job'}
                            </div>
                            <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg">
                                {resolveModal.type === 'refund' && "This will cancel the job effectively immediately and refund 100% of the escrowed amount back to the customer's wallet."}
                                {resolveModal.type === 'release' && "This will mark the job as completed and release the escrowed funds to the worker's wallet immediately."}
                                {resolveModal.type === 'dismiss' && "This will remove the dispute status from the job. The job will resume as 'In Progress'. Use this if the dispute was invalid."}
                                {resolveModal.type === 'reassign_discount' && "This will remove the current worker, reopen the job for new applications, and flag the job for a 25-50% discount application (note will be added)."}
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Final Descision Note <span className="text-red-500">*</span>
                            </label>
                            <textarea 
                                autoFocus
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[120px]"
                                placeholder="Please explain your reasoning for this decision. This will be visible to both parties."
                                value={resolveModal.note}
                                onChange={(e) => setResolveModal({...resolveModal, note: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                        <button 
                            onClick={() => setResolveModal({...resolveModal, isOpen: false})}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={submitResolution}
                            disabled={resolving || !resolveModal.note.trim()}
                            className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {resolving && <Loader2 className="w-4 h-4 animate-spin"/>}
                            Confirm Resolution
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
