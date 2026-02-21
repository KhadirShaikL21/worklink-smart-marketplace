import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { sendEmail } from './email.js';
import { notify } from './notifications.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function computePlatformFee(total, pct = 5) {
  return Number(((total * pct) / 100).toFixed(2));
}

export async function createPaymentIntent({ jobId, payerId, payees = [], total, currency = 'INR', platformFeePct = 5 }) {
  // Stripe minimum amount check (approx $0.50 USD)
  // For INR, let's enforce a minimum of 50 INR to be safe.
  if (currency === 'INR' && total < 50) {
    throw new Error('Payment amount must be at least ₹50');
  }

  const platformFee = computePlatformFee(total, platformFeePct);
  const netToWorkers = total - platformFee;

  const splitAmount = payees.length ? Number((netToWorkers / payees.length).toFixed(2)) : netToWorkers;
  const normalizedPayees = payees.length
    ? payees.map(p => ({ worker: p.worker, amount: p.amount ?? splitAmount, status: 'pending' }))
    : [];

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100), // Stripe expects amount in cents/paise
    currency: currency.toLowerCase(),
    metadata: {
      jobId: jobId.toString(),
      payerId: payerId.toString()
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  const payment = await Payment.create({
    job: jobId,
    payer: payerId,
    payees: normalizedPayees,
    platformFeePct,
    total,
    currency,
    status: 'pending',
    stripePaymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret
  });

  return { payment, clientSecret: paymentIntent.client_secret, platformFee, netToWorkers };
}

export async function markCaptured(paymentId) {
  const payment = await Payment.findByIdAndUpdate(paymentId, { status: 'captured' }, { new: true })
    .populate('payer')
    .populate('job')
    .populate('payees.worker');
    
  if (payment) {
    // Send Receipt to Customer
    if (payment.payer && payment.payer.email) {
      // In-App Notification
      await notify({
        userId: payment.payer._id,
        type: 'payment_success',
        title: 'Payment Successful',
        body: `Payment of ${payment.currency} ${payment.total} for job ${payment.job.title} was successful.`,
        link: `/jobs/${payment.job._id}`,
        metadata: { jobId: payment.job._id, paymentId: payment._id }
      });

      await sendEmail({
        to: payment.payer.email,
        subject: `Payment Receipt: ${payment.job.title}`,
        html: `
          <h2>Payment Receipt</h2>
          <p>Thank you for your payment for job: <strong>${payment.job.title}</strong></p>
          <p>Total Amount: ${payment.currency} ${payment.total}</p>
          <p>Transaction ID: ${payment.stripePaymentIntentId}</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/jobs/${payment.job._id}">View Job Details</a>
        `
      });
    }

    // Send Notification to Workers
    for (const payee of payment.payees) {
      if (payee.worker) {
        // In-App Notification
        await notify({
          userId: payee.worker._id,
          type: 'payment_received',
          title: 'Payment Received',
          body: `You received ${payment.currency} ${payee.amount} for job: ${payment.job.title}`,
          link: `/worker-jobs/${payment.job._id}`,
          metadata: { jobId: payment.job._id, paymentId: payment._id }
        });

        if (payee.worker.email) {
          await sendEmail({
            to: payee.worker.email,
            subject: `Payment Received: ${payment.job.title}`,
            html: `
              <h2>Payment Received</h2>
              <p>You have received a payment for job: <strong>${payment.job.title}</strong></p>
              <p>Amount Credited: ${payment.currency} ${payee.amount}</p>
              <p>(Platform fees have been deducted)</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/worker-jobs/${payment.job._id}">View Job Details</a>
            `
          });
        }
      }
    }
  }
  
  return payment;
}

export async function releasePayouts(paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');

  // Stub: in real integration, trigger transfers. Here we mark released.
  payment.payees = payment.payees.map(p => ({ ...p, status: 'released' }));
  payment.status = 'captured';
  await payment.save();
  return payment;
}

export async function refundPayment(paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');
  payment.status = 'refunded';
  payment.payees = payment.payees.map(p => ({ ...p, status: 'failed' }));
  await payment.save();
  return payment;
}
