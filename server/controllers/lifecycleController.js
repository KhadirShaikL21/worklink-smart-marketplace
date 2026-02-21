import Job from '../models/Job.js';
import Task from '../models/Task.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Completion from '../models/Completion.js';
import { addRating } from '../utils/ratings.js';
import Payment from '../models/Payment.js';
import { releasePayouts, refundPayment } from '../services/payments.js';
import { checkAndAwardBadges, recalculateReputation } from '../services/gamification.js';

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
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.customer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  await Completion.updateMany({ job: jobId }, { status, customerNote: note });
  job.status = status === 'satisfied' ? 'completed' : status === 'needs_fix' ? 'in_progress' : 'disputed';
  await job.save();

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
  }

  // Tie payouts/refunds to satisfaction
  const payment = await Payment.findOne({ job: jobId });
  if (payment) {
    if (status === 'satisfied') {
      await releasePayouts(payment._id);
    } else if (status === 'not_satisfied') {
      await refundPayment(payment._id);
    }
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
