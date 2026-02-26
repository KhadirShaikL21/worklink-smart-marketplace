import Job from '../models/Job.js';
import Task from '../models/Task.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Completion from '../models/Completion.js';
import { addRating } from '../utils/ratings.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { releasePayouts, refundPayment } from '../services/payments.js';
import { checkAndAwardBadges, recalculateReputation } from '../services/gamification.js';
import { notify } from '../services/notifications.js';

export async function acceptTask(req, res) {
  const { taskId } = req.params;
  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (task.worker.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  task.status = 'accepted';
  await task.save();
  await Job.updateOne({ _id: task.job }, { status: 'in_progress' });
  return res.json({ task });
}

export async function completeTask(req, res) {
  const { taskId } = req.params;
  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (task.worker.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  task.status = 'completed';
  await task.save();

  let completion = await Completion.findOne({ job: task.job, worker: task.worker });
  if (!completion) {
    completion = await Completion.create({ job: task.job, worker: task.worker, status: 'pending_customer' });
  } else {
    completion.status = 'pending_customer';
    await completion.save();
  }

  return res.json({ task, completion });
}

export async function customerSatisfaction(req, res) {
  const { jobId } = req.params;
  const { status, note } = req.body; // satisfied | not_satisfied | needs_fix
  const job = await Job.findById(jobId).populate('assignedWorkers', 'email name');
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.customer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  await Completion.updateMany({ job: jobId }, { status, customerNote: note });
  job.status = status === 'satisfied' ? 'completed' : status === 'needs_fix' ? 'in_progress' : 'disputed';
  job.timeline = {
    ...job.timeline,
    completedAt: status === 'satisfied' ? new Date() : undefined
  };
  await job.save();

  try {
    if (status === 'satisfied') {
      // Increment completed jobs and set available
      await WorkerProfile.updateMany(
        { user: { $in: job.assignedWorkers } },
        { 
          $inc: { completedJobs: 1 },
          $set: { isAvailable: true }
        }
      );

      // Gamification hook: Check for badges
      if (job.assignedWorkers && job.assignedWorkers.length > 0) {
        for (const workerId of job.assignedWorkers) {
          await checkAndAwardBadges(workerId);
          await recalculateReputation(workerId);
        }
      }

      // Handle Payment and Payout
      let payment = await Payment.findOne({ job: jobId });
      
      // If no payment exists, create one for completed work
      if (!payment && job.assignedWorkers && job.assignedWorkers.length > 0) {
        console.log('No payment found for completed job, creating one:', jobId);
        
        const totalAmount = job.budget?.max || job.budget?.min || 500; // Default fallback
        const platformFeePct = 5;
        const platformFee = (totalAmount * platformFeePct) / 100;
        const netToWorkers = totalAmount - platformFee;
        const amountPerWorker = Math.floor(netToWorkers / job.assignedWorkers.length);
        
        const payees = job.assignedWorkers.map(workerId => ({
          worker: workerId,
          amount: amountPerWorker,
          status: 'released' // Immediately mark as released since work is done
        }));
        
        payment = await Payment.create({
          job: jobId,
          payer: job.customer,
          payees: payees,
          platformFeePct: platformFeePct,
          total: totalAmount,
          currency: 'INR',
          status: 'captured', // Mark as captured since work is completed
          stripePaymentIntentId: `offline_${jobId}_${Date.now()}` // Mark as offline payment
        });
        
        console.log('Payment created for completed job:', payment._id);
      } else if (payment) {
        // Existing payment flow
        console.log('Payment found, releasing payouts for job:', jobId);
        await releasePayouts(payment._id);
      }
      
      // Notify all workers that payment has been released
      if (payment && payment.payees && payment.payees.length > 0) {
        for (const payee of payment.payees) {
          if (payee.status === 'released' && payee.worker) {
            try {
              const worker = await User.findById(payee.worker);
              if (worker && worker.email) {
                await notify({
                  userId: payee.worker,
                  type: 'job_completed_paid',
                  title: 'Job Completed & Payment Released',
                  body: `Congratulations! Your job "${job.title}" has been completed and ₹${payee.amount} has been credited to your account.`,
                  link: `/worker-jobs/${jobId}`,
                  metadata: { jobId, paymentId: payment._id, amount: payee.amount }
                });
              }
            } catch (e) {
              console.error('Error notifying worker:', e);
            }
          }
        }
      }
    } else if (status === 'not_satisfied') {
      // Refund payment
      const payment = await Payment.findOne({ job: jobId });
      if (payment) {
        await refundPayment(payment._id);
        
        // Notify workers that payment was refunded
        if (payment.payees && payment.payees.length > 0) {
          for (const payee of payment.payees) {
            if (payee.worker) {
              await notify({
                userId: payee.worker,
                type: 'job_refunded',
                title: 'Job Refunded',
                body: `The job "${job.title}" was not satisfactory and has been refunded. Please contact the customer for details.`,
                link: `/my-disputes`,
                metadata: { jobId }
              });
            }
          }
        }
      }
    } else if (status === 'disputed') {
      // Notify workers about dispute
      if (job.assignedWorkers && job.assignedWorkers.length > 0) {
        for (const workerId of job.assignedWorkers) {
          await notify({
            userId: workerId,
            type: 'job_disputed',
            title: 'Dispute Raised',
            body: `A dispute has been raised for job "${job.title}". Please check your disputes section.`,
            link: `/my-disputes`,
            metadata: { jobId }
          });
        }
      }
    }
  } catch (err) {
    console.error('Error in customerSatisfaction:', err);
  }

  return res.json({ job, status });
}

export async function submitRating(req, res) {
  const { jobId } = req.params;
  const { taskId, workerId, punctuality, quality, professionalism, review } = req.body;
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.customer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  if (![punctuality, quality, professionalism].every(v => v >= 1 && v <= 5)) {
    return res.status(400).json({ message: 'Scores must be 1-5' });
  }

  const rating = await addRating({
    jobId,
    taskId,
    workerId,
    customerId: req.user._id,
    scores: { punctuality, quality, professionalism },
    review
  });

  // Gamification hook: Check for badges
  if (workerId) {
    await checkAndAwardBadges(workerId);
    await recalculateReputation(workerId);
  }

  return res.status(201).json({ rating });
}
