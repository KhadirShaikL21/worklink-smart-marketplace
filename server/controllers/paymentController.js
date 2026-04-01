import { createPaymentIntent, markCaptured, releasePayouts, refundPayment } from '../services/payments.js';
import Payment from '../models/Payment.js';
import Job from '../models/Job.js';
import mongoose from 'mongoose';

export async function createIntent(req, res) {
  const { jobId, currency = 'INR', payees = [], platformFeePct = 5 } = req.body;
  if (!jobId) return res.status(400).json({ message: 'jobId required' });
  
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.customer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  // Use job budget amount, not the amount from request
  const total = job.budget?.max || 0;
  if (total <= 0) return res.status(400).json({ message: 'Job must have a budget amount' });

  // If no payees specified, use assigned workers
  let payeeList = payees;
  if (payeeList.length === 0 && job.assignedWorkers?.length > 0) {
    payeeList = job.assignedWorkers.map(workerId => ({ worker: workerId }));
  }

  const result = await createPaymentIntent({ jobId, payerId: req.user._id, payees: payeeList, total, currency, platformFeePct });
  return res.status(201).json(result);
}

export async function capture(req, res) {
  const { paymentId } = req.params;
  try {
    const payment = await markCaptured(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    // In test mode, auto-mark payees as released immediately since we don't use webhooks
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      payment.payees = payment.payees.map(p => ({
        ...p,
        status: 'released'  // Auto-release in test mode
      }));
      await payment.save();
    }
    
    return res.json({ payment });
  } catch (error) {
    console.error('Payment capture error:', error);
    return res.status(400).json({ message: error.message });
  }
}

export async function release(req, res) {
  const { paymentId } = req.params;
  try {
    const payment = await releasePayouts(paymentId);
    return res.json({ payment });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function refund(req, res) {
  const { paymentId } = req.params;
  try {
    const payment = await refundPayment(paymentId);
    return res.json({ payment });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

import WorkerProfile from '../models/WorkerProfile.js';

export async function getWorkerStats(req, res) {
  try {
    // Ensure only workers can access their stats
    if (!req.user.roles.includes('worker')) {
      return res.status(403).json({ message: 'Only workers can access wallet stats' });
    }

    const userId = req.user._id;

    // Get worker's payment stats grouped by status
    const stats = await Payment.aggregate([
      // Match payments involving this worker
      { $match: { 'payees.worker': new mongoose.Types.ObjectId(userId) } },
      // Unwind payees array to process individual entries
      { $unwind: '$payees' },
      // Filter for only this worker's entry
      { $match: { 'payees.worker': new mongoose.Types.ObjectId(userId) } },
      // Group by status
      {
        $group: {
          _id: '$payees.status', // 'pending', 'released', 'failed'
          totalAmount: { $sum: '$payees.amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const earnings = {
      pending: 0,
      released: 0,
      failed: 0,
      total: 0
    };

    // Populate earnings object
    stats.forEach(s => {
      if (s._id && earnings.hasOwnProperty(s._id)) {
        earnings[s._id] = s.totalAmount;
      }
    });
    
    // Total is sum of pending and released (failed amounts are excluded)
    earnings.total = earnings.released + earnings.pending;
    
    // currentBalance should always equal released amount (amount available to withdraw)
    // This ensures consistency with admin dashboard totalWorkerPayouts
    const currentBalance = earnings.released;

    // Get ALL transactions for this worker (not a limited list)
    const transactions = await Payment.find({ 'payees.worker': userId })
      .sort({ createdAt: -1 })
      .populate('job', 'title budget status')
      .populate('payer', 'name email')
      .lean();

    // Format transactions for the frontend
    const formattedTransactions = transactions.map(t => {
      const payeeRecord = t.payees.find(p => p.worker.toString() === userId.toString());
      return {
        _id: t._id,
        jobTitle: t.job?.title || 'Unknown Job',
        jobStatus: t.job?.status || 'unknown',
        payerName: t.payer?.name || 'Unknown Payer',
        amount: payeeRecord?.amount || 0,
        status: payeeRecord?.status || 'unknown',
        platformFee: Math.round(t.total * (t.platformFeePct || 5) / 100),
        grossAmount: t.total,
        date: t.createdAt,
        paymentId: t._id
      };
    });

    return res.json({ 
      stats: { 
        ...earnings, 
        currentBalance  // Now equals earnings.released for consistency
      }, 
      recentTransactions: formattedTransactions 
    });
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    return res.status(500).json({ message: 'Failed to fetch wallet stats' });
  }
}

export async function listPayments(req, res) {
  const payments = await Payment.find({ payer: req.user._id }).sort({ createdAt: -1 });
  return res.json({ payments });
}
