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

export async function listPayments(req, res) {
  const payments = await Payment.find({ payer: req.user._id }).sort({ createdAt: -1 });
  return res.json({ payments });
}
