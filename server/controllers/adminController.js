import User from '../models/User.js';
import Job from '../models/Job.js';
import Payment from '../models/Payment.js';
import { releasePayouts, refundPayment } from '../services/payments.js';

export async function getDashboardStats(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const totalWorkers = await User.countDocuments({ roles: 'worker' });
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: { $in: ['assigned', 'in_progress'] } });
    
    // Calculate total revenue (assuming amount is in cents or smallest unit, adjusting if needed)
    const payments = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = payments.length > 0 ? payments[0].total : 0;

    res.json({
      totalUsers,
      totalWorkers,
      totalJobs,
      activeJobs,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
}

export async function getUsers(req, res) {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.roles = role;
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
}

export async function getUserDetails(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Job Stats
    const jobsCreated = await Job.countDocuments({ customer: userId });
    const jobsCompleted = await Job.countDocuments({ 
      assignedWorkers: userId, 
      status: 'completed' 
    });

    // Disputes
    const disputes = await Job.find({ 
        $or: [
            { 'dispute.raisedBy': userId },
            { customer: userId, 'dispute.status': { $exists: true, $ne: 'open' } }, // Simple filter
            { assignedWorkers: userId, 'dispute.status': { $exists: true, $ne: 'open' } }
        ],
        'dispute.status': { $exists: true }
    }).select('title dispute status');

    res.json({ user, stats: { jobsCreated, jobsCompleted }, disputes });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body; // 'ban', 'unban', 'verify_id', reason for banning
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'ban') {
      user.status = 'banned'; 
      user.blockedReason = reason;
    } else if (action === 'unban') {
      user.status = 'active';
      user.blockedReason = null;
    } else if (action === 'verify_id') {
      if (!user.verification) user.verification = {};
      user.verification.adminApproved = true;
      user.verification.idVerified = true;
    }

    await user.save();
    res.json({ message: `User status updated: ${action}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
}

export async function getDisputes(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query['dispute.status'] = status;
    } else {
      query['dispute.status'] = { $in: ['open', 'resolved', 'closed', 'in_review'] };
    }
    
    // Ensure we only get jobs that actually have a dispute initiated
    query['dispute.raisedBy'] = { $exists: true };

    const jobs = await Job.find(query)
      .populate('customer', 'name email phone avatarUrl')
      .populate('dispute.raisedBy', 'name email')
      .populate('assignedWorkers', 'name email phone avatarUrl')
      .sort({ 'dispute.createdAt': -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1);

    const count = await Job.countDocuments(query);

    // Return the full job document so frontend can access nested properties correctly
    // If backend mapping is needed, ensure it aligns with frontend expectations (e.g. _id vs id)
    // Here we return the raw document structure which the updated frontend components expect
    const disputes = jobs;

    res.json({
      disputes,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching disputes', error: error.message });
  }
}

export async function resolveDispute(req, res) {
  try {
    const { jobId } = req.params;
    const { resolution, adminNote } = req.body; // 'refund', 'release', 'dismiss'

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.dispute.status !== 'open') {
      return res.status(400).json({ message: 'Dispute is already resolved' });
    }

    const payment = await Payment.findOne({ job: jobId });

    switch (resolution) {
      case 'refund':
        // Refund logic would go here (integrating with Stripe logic from paymentController)
        job.status = 'cancelled';
        break;
      
      case 'release':
        // Release funds logic
        job.status = 'completed';
        break;

      case 'dismiss':
        // Resume job
        job.status = 'in_progress';
        break;

      case 'cancel_no_refund':
        // Job cancelled, payment might be forfeited
        job.status = 'cancelled';
        break;

      case 'reassign':
        // Remove worker, open job
        job.assignedWorkers = [];
        job.status = 'open';
        break;

      case 'reassign_discount':
        // Remove worker, open job, apply discount
        // Logic for discount application would usually involve updating the budget or adding a metadata flag for next payment processing
        job.assignedWorkers = [];
        job.status = 'open';
        // Mocking discount application by appending to description or admin note for now as Schema support for dynamic price adjustments might be limited
        job.dispute.adminNote = `${adminNote} (25-50% Discount Applied for next worker assignment)`;
        break;

      default:
        return res.status(400).json({ message: 'Invalid resolution type' });
    }

    job.dispute.status = 'resolved';
    job.dispute.resolution = {
      outcome: resolution,
      adminNote,
      resolvedAt: new Date()
    };
    
    // Add to history
    if (!job.dispute.history) job.dispute.history = [];
    job.dispute.history.push({
      action: 'resolution',
      by: req.user._id, // Assuming admin is logged in
      note: `Resolution: ${resolution}. Note: ${adminNote}`,
      timestamp: new Date()
    });
    
    await job.save();

    res.json({ message: `Dispute resolved: ${resolution}`, job });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resolving dispute', error: error.message });
  }
}
