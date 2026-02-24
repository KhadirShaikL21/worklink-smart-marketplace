import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, MessageSquare, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const DISPUTE_CATEGORIES = [
  {
    id: 'quality',
    label: 'Work Quality',
    icon: AlertTriangle,
    issues: ['Incomplete Work', 'Poor Craftsmanship', 'Did not follow instructions', 'Item Damaged'],
    suggestedResolution: 'We recommend asking the worker to return and fix the specific issues. Often this is faster than a formal dispute.'
  },
  {
    id: 'behavior',
    label: 'Professionalism & Behavior',
    icon: MessageSquare,
    issues: ['Rude or Abusive', 'Harassment', 'Unsafe Behavior', 'Did not show up (No-show)'],
    suggestedResolution: 'Safety is our priority. Please report any unsafe behavior immediately. For no-shows, you can cancel the job without penalty.'
  },
  {
    id: 'financial',
    label: 'Payment & Billing',
    icon: ShieldAlert,
    issues: ['Overcharged', 'Requested off-platform payment', 'Payment failed', 'Refused to release funds'],
    suggestedResolution: 'All payments must go through WorkLink for your protection. Do not pay cash.'
  },
  {
    id: 'other',
    label: 'Other Issues',
    icon: CheckCircle,
    issues: ['Other'],
    suggestedResolution: 'Please describe your issue in detail so our support team can assist you effectively.'
  }
];

export default function DisputeResolutionModal({ isOpen, onClose, jobId, onDisputeRaised }) {
  const [step, setStep] = useState(1); // 1: Select Category, 2: Select Issue & Describe, 3: Review & Submit
  const [category, setCategory] = useState(null);
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setIssue(cat.issues[0]); // Default to first issue
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please provide a description of the problem.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post(`/api/jobs/${jobId}/dispute`, {
        category: category.id,
        reason: issue, // Mapping 'reason' to the specific issue selected
        description: description
      });
      onDisputeRaised();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise dispute.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
         <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
           <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
         </div>

         <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative"
         >
            <div className="bg-white p-6">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <ShieldAlert className="w-6 h-6 text-red-600 mr-2" />
                    Resolution Center
                 </h2>
                 <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
                <div 
                   className="bg-red-600 h-1.5 rounded-full transition-all duration-300" 
                   style={{ width: `${(step / 3) * 100}%` }}
                ></div>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <p className="text-gray-600 mb-4">What seems to be the problem? Select a category to proceed.</p>
                    <div className="grid gap-3">
                      {DISPUTE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat)}
                          className="flex items-center p-4 border rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group text-left"
                        >
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-red-100 transition-colors mr-4">
                            <cat.icon className="w-6 h-6 text-gray-600 group-hover:text-red-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block">{cat.label}</span>
                            <span className="text-xs text-gray-500 line-clamp-1">{cat.issues.join(', ')}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && category && (
                   <motion.div 
                     key="step2" 
                     initial={{ opacity: 0, x: 20 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     exit={{ opacity: 0, x: -20 }}
                   >
                     <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-blue-900 mb-1 flex items-center">
                           <CheckCircle className="w-4 h-4 mr-2" />
                           Our Recommendation
                        </h4>
                        <p className="text-sm text-blue-700">{category.suggestedResolution}</p>
                     </div>

                     <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specific Issue</label>
                        <select 
                          value={issue} 
                          onChange={(e) => setIssue(e.target.value)}
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500"
                        >
                          {category.issues.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                     </div>

                     <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description & Evidence</label>
                        <textarea
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Please describe what happened in detail..."
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500"
                        />
                     </div>

                     <div className="flex gap-3">
                        <button 
                          onClick={() => setStep(1)} 
                          className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                        >
                          Back
                        </button>
                        <button 
                          onClick={handleSubmit} 
                          disabled={loading}
                          className="flex-1 py-3 bg-red-600 rounded-xl text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex justify-center items-center"
                        >
                          {loading ? 'Submitting...' : 'Submit Claim'}
                        </button>
                     </div>
                     {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
                   </motion.div>
                )}
              </AnimatePresence>
            </div>
         </motion.div>
       </div>
    </div>
  );
}