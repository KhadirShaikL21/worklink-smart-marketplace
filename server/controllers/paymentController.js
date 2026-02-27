import { createPaymentIntent, markCaptured, releasePayouts, refundPayment } from '../services/payments.js';
import Payment from '../models/Payment.js';
import Job from '../models/Job.js';
import mongoose from 'mongoose';

export async function createIntent(req, res) {
  const { jobId, total, currency = 'INR', payees = [], platformFeePct = 5 } = req.body;
  if (!jobId || !total) return res.status(400).json({ message: 'jobId and total required' });
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.customer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  const result = await createPaymentIntent({ jobId, payerId: req.user._id, payees, total, currency, platformFeePct });
  return res.status(201).json(result);
}

export async function capture(req, res) {
  const { paymentId } = req.params;
  const payment = await markCaptured(paymentId);
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  return res.json({ payment });
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
    // ... existing checks ...
    if (!req.user.roles.includes('worker')) {
      return res.status(403).json({ message: 'Only workers can access wallet stats' });
    }

    const userId = req.user._id;

    // Get current wallet balance from profile
    const workerProfile = await WorkerProfile.findOne({ user: userId });
    const currentBalance = workerProfile ? workerProfile.walletBalance : 0;
    
    const stats = await Payment.aggregate([
      // First match payments involving this worker
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
    
    earnings.total = earnings.released + earnings.pending;

    // Get recent transactions
    const transactions = await Payment.find({ 'payees.worker': userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('job', 'title description')
      .populate('payer', 'name email');

    // Format transactions for the frontend
    const formattedTransactions = transactions.map(t => {
      const payeeRecord = t.payees.find(p => p.worker.toString() === userId.toString());
      return {
        _id: t._id,
        jobTitle: t.job?.title || 'Unknown Job',
        payerName: t.payer?.name || 'Unknown Payer',
        amount: payeeRecord?.amount || 0,
        status: payeeRecord?.status,
        date: t.createdAt
      };
    });

    return res.json({ stats: { ...earnings, currentBalance }, recentTransactions: formattedTransactions });
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    return res.status(500).json({ message: 'Failed to fetch wallet stats' });
  }
}

export async function listPayments(req, res) {
  const payments = await Payment.find({ payer: req.user._id }).sort({ createdAt: -1 });
  return res.json({ payments });
}
