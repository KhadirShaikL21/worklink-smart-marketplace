import Job from '../models/Job.js';
import Task from '../models/Task.js';
import { rankWorkersForJob } from '../services/matching.js';
import { optimizeTeam } from '../services/team.js';
import ChatRoom from '../models/ChatRoom.js';
import { notify } from '../services/notifications.js';

import WorkerProfile from '../models/WorkerProfile.js';
import Payment from '../models/Payment.js';

export async function createJob(req, res) {
  const {
    title,
    category,
    description,
    skillsRequired = [],
    tasks = [],
    hoursEstimate,
    budget,
    toolsRequired = [],
    urgency = 'medium',
    location,
    workersNeeded = 1,
    preferences = {},
    problemVideoUrl
  } = req.body;

  if (!location?.coordinates) {
    return res.status(400).json({ message: 'Location required' });
  }

  const job = await Job.create({
    customer: req.user._id,
    title,
    category,
    description,
    skillsRequired,
    tasks,
    hoursEstimate,
    budget,
    toolsRequired,
    urgency,
    workersNeeded,
    location,
    preferences,
    media: {
      problemVideoUrl
    }
  });

  // Notify matching workers
  if (skillsRequired.length > 0) {
    // Find workers with at least one matching skill
    const matchingProfiles = await WorkerProfile.find({
      skills: { $in: skillsRequired },
      isAvailable: true
    }).select('user');

    const workerIds = matchingProfiles.map(p => p.user);
    
    for (const workerId of workerIds) {
      // Don't notify the creator if they are also a worker (unlikely but possible)
      if (workerId.toString() === req.user._id.toString()) continue;

      await notify({
        userId: workerId,
        type: 'job_alert',
        title: 'New Job Match',
        body: `A new job "${title}" matches your skills!`,
        metadata: { jobId: job._id }
      });
    }
  }

  return res.status(201).json({ job });
}

export async function formTeam(req, res) {
  const { jobId } = req.params;
  const { roles = [] } = req.body; // [{ role: 'plumber', skill: 'plumbing' }, ...]
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (!job.skillsRequired?.length) {
    return res.status(400).json({ message: 'Job missing skillsRequired' });
  }

  // For each role, rank and pick top candidate for now (greedy; replace with Hungarian later)
  const tasks = [];
  for (const role of roles) {
    const result = await rankWorkersForJob(jobId, undefined);
    const top = result.ranked.find(r => r.skills?.includes(role.skill || role.role));
    if (!top) continue;
    const task = await Task.create({ job: job._id, worker: top.workerId, role: role.role, payout: job.budget?.max || 0 });
    tasks.push(task);
  }

  job.team = tasks.map(t => t._id);
  job.assignedWorkers = tasks.map(t => t.worker);
  job.status = 'assigned';
  
  if (!job.startOtp) {
    job.startOtp = Math.floor(1000 + Math.random() * 9000).toString();
  }
  
  await job.save();

  // Create ChatRoom
  const participantIds = [job.customer, ...job.assignedWorkers];
  await ChatRoom.findOneAndUpdate(
    { job: job._id },
    { job: job._id, participants: participantIds, type: participantIds.length > 2 ? 'group' : 'direct' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Notify Customer
  await notify({
    userId: job.customer,
    type: 'job_update',
    title: 'Team Formed',
    body: `A team has been formed for your job: ${job.title}`,
    metadata: { jobId: job._id }
  });

  // Notify Workers
  for (const task of tasks) {
    await notify({
      userId: task.worker,
      type: 'job_assignment',
      title: 'New Job Assignment',
      body: `You have been assigned to job: ${job.title} as ${task.role}`,
      metadata: { jobId: job._id, taskId: task._id }
    });
  }

  return res.json({ job, tasks });
}

export async function formTeamOptimized(req, res) {
  const { jobId } = req.params;
  const { roles = [] } = req.body;
  try {
    const result = await optimizeTeam(jobId, roles);
    const { job, tasks } = result;

    if (tasks && tasks.length > 0) {
      // Create ChatRoom
      const participantIds = [job.customer, ...job.assignedWorkers];
      await ChatRoom.findOneAndUpdate(
        { job: job._id },
        { job: job._id, participants: participantIds, type: participantIds.length > 2 ? 'group' : 'direct' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Notify Customer
      await notify({
        userId: job.customer,
        type: 'job_update',
        title: 'Team Optimized & Formed',
        body: `An optimized team has been formed for your job: ${job.title}`,
        metadata: { jobId: job._id }
      });

      // Notify Workers
      for (const task of tasks) {
        await notify({
          userId: task.worker,
          type: 'job_assignment',
          title: 'New Job Assignment',
          body: `You have been assigned to job: ${job.title} as ${task.role}`,
          metadata: { jobId: job._id, taskId: task._id }
        });
      }

      // Create or Update Chat Room for the Job
      const allWorkerIds = tasks.map(t => t.worker.toString());
      const participants = [...new Set([job.customer.toString(), ...allWorkerIds])];
      
      let chatRoom = await ChatRoom.findOne({ job: job._id });
      if (chatRoom) {
        // Update participants if room exists
        chatRoom.participants = participants;
        await chatRoom.save();
      } else {
        // Create new room
        chatRoom = await ChatRoom.create({
          job: job._id,
          participants: participants,
          type: 'group' // Always group for job context
        });
      }
    }

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function assignWorkers(req, res) {
  const { jobId } = req.params;
  const { count, workerIds = [] } = req.body;
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  if (job.customer.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

  const workersNeeded = Number(count) || job.workersNeeded || 1;
  let selectedWorkers = [];

  if (workerIds.length) {
    selectedWorkers = workerIds.map(id => ({ workerId: id }));
  } else {
    const ranking = await rankWorkersForJob(jobId);
    selectedWorkers = ranking.ranked.slice(0, workersNeeded);
  }

  const tasks = [];
  for (const candidate of selectedWorkers) {
    const existing = await Task.findOne({ job: job._id, worker: candidate.workerId });
    if (existing) {
      tasks.push(existing);
      continue;
    }
    const task = await Task.create({
      job: job._id,
      worker: candidate.workerId,
      role: job.category || 'worker',
      payout: job.budget?.max || 0
    });
    tasks.push(task);
  }

  job.team = tasks.map(t => t._id);
  job.assignedWorkers = tasks.map(t => t.worker);
  job.status = tasks.length ? 'assigned' : job.status;
  
  // Generate OTP if assigned
  if (job.status === 'assigned' && !job.startOtp) {
    job.startOtp = Math.floor(1000 + Math.random() * 9000).toString();
  }

  if (tasks.length > 0) {
    job.timeline = job.timeline || {};
    job.timeline.assignedAt = new Date();
  }

  await job.save();

  // Update worker availability
  if (tasks.length > 0) {
    await WorkerProfile.updateMany(
      { user: { $in: job.assignedWorkers } },
      { $set: { isAvailable: false } }
    );
  }

  // Create or Update Chat Room for the Job
  const allWorkers = job.assignedWorkers.map(w => w.toString());
  const participants = [...new Set([job.customer.toString(), ...allWorkers])];
  
  let chatRoom = await ChatRoom.findOne({ job: job._id });
  if (chatRoom) {
    chatRoom.participants = participants;
    await chatRoom.save();
  } else {
    await ChatRoom.create({
      job: job._id,
      participants: participants,
      type: 'group'
    });
  }

  // Notify Workers
  for (const task of tasks) {
    await notify({
      userId: task.worker,
      type: 'job_assignment',
      title: 'New Job Assigned',
      body: `You have been assigned to job: ${job.title}`,
      metadata: { jobId: job._id }
    });
  }

  return res.json({ job, tasks });
}

export async function listMyJobs(req, res) {
  const filters = [];
  if (req.user.roles?.includes('customer')) {
    filters.push({ customer: req.user._id });
  }
  if (req.user.roles?.includes('worker')) {
    filters.push({ assignedWorkers: req.user._id });
  }

  if (!filters.length) {
    return res.status(403).json({ message: 'No roles to view jobs' });
  }

  const jobs = await Job.find({ $or: filters }).sort({ createdAt: -1 });
  return res.json({ jobs });
}

export async function acceptJob(req, res) {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  // Check if user is an assigned worker
  const isAssigned = job.assignedWorkers.some(w => w.toString() === req.user._id.toString());
  if (!isAssigned) {
    return res.status(403).json({ message: 'Only assigned workers can accept the job' });
  }

  if (job.status !== 'assigned') {
    return res.status(400).json({ message: `Job is already ${job.status}` });
  }

  job.status = 'accepted';
  job.timeline = job.timeline || {};
  job.timeline.acceptedAt = new Date(); // You might want to add acceptedAt to Job schema timeline or just use updatedAt
  await job.save();

  // Notify Customer
  await notify({
    userId: job.customer,
    type: 'job_update',
    title: 'Job Accepted',
    body: `Worker has accepted the job assignment.`,
    metadata: { jobId: job._id }
  });

  return res.json({ message: 'Job accepted', job });
}

export async function startTravel(req, res) {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  // Check if user is an assigned worker
  const isAssigned = job.assignedWorkers.some(w => w.toString() === req.user._id.toString());
  if (!isAssigned) {
    return res.status(403).json({ message: 'Only assigned workers can start travel' });
  }

  if (job.status !== 'assigned' && job.status !== 'accepted') {
    return res.status(400).json({ message: `Job is already ${job.status}` });
  }

  job.status = 'en_route';
  job.timeline = job.timeline || {};
  job.timeline.travelStartedAt = new Date();
  await job.save();

  // Notify Customer
  await notify({
    userId: job.customer,
    type: 'job_update',
    title: 'Worker En Route',
    body: `Worker is on the way to your location`,
    metadata: { jobId: job._id }
  });

  return res.json({ message: 'Travel started', job });
}

export async function verifyStartOtp(req, res) {
  const { jobId } = req.params;
  const { otp } = req.body;

  const job = await Job.findById(jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  // Check if user is an assigned worker
  const isAssigned = job.assignedWorkers.some(w => w.toString() === req.user._id.toString());
  if (!isAssigned) {
    return res.status(403).json({ message: 'Only assigned workers can start the job' });
  }

  if (job.status !== 'assigned' && job.status !== 'en_route' && job.status !== 'accepted') {
    return res.status(400).json({ message: `Job is already ${job.status}` });
  }

  if (job.startOtp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  job.status = 'in_progress';
  job.timeline = job.timeline || {};
  if (!job.timeline.startedAt) {
    const now = new Date();
    job.timeline.startedAt = now;
    if (job.timeline.travelStartedAt) {
      const travelDurationMinutes = Math.max(0, Math.round((now.getTime() - job.timeline.travelStartedAt.getTime()) / 60000));
      job.summary = job.summary || {};
      job.summary.travelDurationMinutes = travelDurationMinutes;
    }
  }
  await job.save();

  // Notify Customer
  await notify({
    userId: job.customer,
    type: 'job_update',
    title: 'Job Started',
    body: `Worker has started the job: ${job.title}`,
    metadata: { jobId: job._id }
  });

  return res.json({ message: 'Job started successfully', job });
}

export async function getJob(req, res) {
  const { jobId } = req.params;
  const job = await Job.findById(jobId).populate('assignedWorkers', 'name email phone');
  if (!job) return res.status(404).json({ message: 'Job not found' });
  const isCustomer = job.customer.toString() === req.user._id.toString();
  const isAssignedWorker = job.assignedWorkers?.some(w => w._id.toString() === req.user._id.toString());
  if (!isCustomer && !isAssignedWorker) return res.status(403).json({ message: 'Forbidden' });

  const jobData = job.toObject();
  if (!isCustomer) {
    delete jobData.startOtp;
  }

  const payment = await Payment.findOne({ job: jobId }).sort({ createdAt: -1 }).lean();
  if (payment) {
    jobData.payment = {
      total: payment.total,
      currency: payment.currency,
      status: payment.status,
      platformFeePct: payment.platformFeePct,
      updatedAt: payment.updatedAt,
      payees: (payment.payees || []).map(p => ({
        worker: p.worker,
        amount: p.amount,
        status: p.status
      }))
    };
  }

  return res.json({ job: jobData });
}

import { sendEmail } from '../services/email.js';

export async function completeJob(req, res) {
  const { jobId } = req.params;
  const { videoUrl, imageUrls } = req.body;

  const job = await Job.findById(jobId).populate('customer').populate('assignedWorkers');
  if (!job) return res.status(404).json({ message: 'Job not found' });

  // Check if user is an assigned worker
  const isAssigned = job.assignedWorkers.some(w => w._id.toString() === req.user._id.toString());
  if (!isAssigned) {
    return res.status(403).json({ message: 'Only assigned workers can complete the job' });
  }

  if (job.status !== 'in_progress') {
    return res.status(400).json({ message: `Job must be in progress to complete. Current status: ${job.status}` });
  }

  if (!imageUrls || imageUrls.length < 3) {
    return res.status(400).json({ message: 'Proof of work required: at least 3 photos.' });
  }

  const now = new Date();
  job.timeline = job.timeline || {};
  job.timeline.completedAt = now;
  job.summary = job.summary || {};

  const startedAt = job.timeline.startedAt;
  if (startedAt) {
    const workDurationMinutes = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 60000));
    job.summary.workDurationMinutes = workDurationMinutes;
  }
  if (!job.summary.travelDurationMinutes && job.timeline.travelStartedAt && startedAt) {
    const travelDurationMinutes = Math.max(0, Math.round((startedAt.getTime() - job.timeline.travelStartedAt.getTime()) / 60000));
    job.summary.travelDurationMinutes = travelDurationMinutes;
  }
  const durations = [job.summary.travelDurationMinutes, job.summary.workDurationMinutes].filter(v => typeof v === 'number');
  if (durations.length) {
    job.summary.totalDurationMinutes = durations.reduce((acc, curr) => acc + curr, 0);
  }

  job.status = 'completed';
  job.completionProof = {
    videoUrl: videoUrl || null,
    imageUrls
  };
  await job.save();

  // Set workers back to available
  if (job.assignedWorkers && job.assignedWorkers.length > 0) {
    const workerIds = job.assignedWorkers.map(w => w._id || w);
    await WorkerProfile.updateMany(
      { user: { $in: workerIds } },
      { $set: { isAvailable: true } }
    );
  }

  // Notify Customer
  await notify({
    userId: job.customer._id,
    type: 'job_update',
    title: 'Job Completed',
    body: `Worker has marked the job as completed. Please review the proof of work.`,
    metadata: { jobId: job._id },
    channels: ['inapp', 'email']
  });

  // Send Email to Customer
  if (job.customer.email) {
    await sendEmail({
      to: job.customer.email,
      subject: `Job Completed: ${job.title}`,
      html: `
        <h2>Job Completed</h2>
        <p>The job <strong>${job.title}</strong> has been marked as completed by the worker.</p>
        <p>Please log in to review the proof of work and release the payment.</p>
        <a href="${process.env.CLIENT_URL}/jobs/${job._id}">View Job</a>
      `
    });
  }

  // Send Email to Worker
  const worker = job.assignedWorkers.find(w => w._id.toString() === req.user._id.toString());
  if (worker && worker.email) {
    await sendEmail({
      to: worker.email,
      subject: `Job Submitted: ${job.title}`,
      html: `
        <h2>Job Submitted</h2>
        <p>You have successfully submitted the job <strong>${job.title}</strong>.</p>
        <p>The customer has been notified to review your work.</p>
      `
    });
  }

  return res.json({ message: 'Job completed successfully', job });
}

export async function listOpenJobs(req, res) {
  try {
    // Find jobs that are 'open' and not fully assigned
    // We can also filter by location if needed later
    const jobs = await Job.find({ 
      status: 'open',
      // Ensure the current user hasn't already applied
      'applicants.worker': { $ne: req.user._id }
    })
    .sort({ createdAt: -1 })
    .populate('customer', 'name avatarUrl');

    return res.json({ jobs });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch open jobs' });
  }
}

export async function applyForJob(req, res) {
  const { jobId } = req.params;
  
  try {
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is no longer open for applications' });
    }

    // Check if already applied
    const alreadyApplied = job.applicants.some(a => a.worker.toString() === req.user._id.toString());
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Add to applicants
    job.applicants.push({
      worker: req.user._id,
      status: 'pending'
    });

    await job.save();

    // Notify Customer
    await notify({
      userId: job.customer,
      type: 'job_application',
      title: 'New Job Application',
      body: `A worker has applied for your job: ${job.title}`,
      metadata: { jobId: job._id, workerId: req.user._id }
    });

    return res.json({ message: 'Application submitted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to apply for job' });
  }
}
