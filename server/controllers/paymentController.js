import { createPaymentIntent, markCaptured, releasePayouts, refundPayment } from '../services/payments.js';
import Payment from '../models/Payment.js';
import Job from '../models/Job.js';

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

export async function getWorkerStats(req, res) {
  try {
    // Ensure only workers can access their stats
    if (!req.user.roles.includes('worker')) {
      return res.status(403).json({ message: 'Only workers can access wallet stats' });
    }

    const userId = req.user._id;
    
    const stats = await Payment.aggregate([
      { $match: { 'payees.worker': userId } },
      { $unwind: '$payees' },
      { $match: { 'payees.worker': userId } },
      {
        $group: {
          _id: '$payees.status',
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

    stats.forEach(s => {
      if (earnings[s._id] !== undefined) {
        earnings[s._id] = s.totalAmount;
      }
      earnings.total += s.totalAmount;
    });

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

    return res.json({ stats: earnings, recentTransactions: formattedTransactions });
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    return res.status(500).json({ message: 'Failed to fetch wallet stats' });
  }
}

export async function listPayments(req, res) {
  const payments = await Payment.find({ payer: req.user._id }).sort({ createdAt: -1 });
  return res.json({ payments });
}
