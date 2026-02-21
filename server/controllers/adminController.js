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

export async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'ban', 'unban', 'verify_id'
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'ban') {
      user.status = 'banned'; 
    } else if (action === 'unban') {
      user.status = 'active';
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
    const { page = 1, limit = 10, status = 'open' } = req.query;

    const query = {
      'dispute.status': status
    };

    const jobs = await Job.find(query)
      .populate('customer', 'name email phone avatarUrl')
      .populate('dispute.raisedBy', 'name email')
      .populate('assignedWorkers', 'name email phone avatarUrl')
      .sort({ 'dispute.createdAt': -1 })
      .skip((page - 1) * limit)
      .limit(limit * 1);

    const count = await Job.countDocuments(query);

    // Format for frontend
    const disputes = jobs.map(job => ({
      id: job._id,
      jobTitle: job.title,
      customer: job.customer,
      worker: job.assignedWorkers[0], // Assuming single worker for simplicity in list
      raisedBy: job.dispute.raisedBy, 
      reason: job.dispute.reason,
      description: job.dispute.description,
      status: job.dispute.status,
      createdAt: job.dispute.createdAt,
      amount: job.budget.min // Simplified estimate
    }));

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
        if (payment) await refundPayment(payment._id);
        job.status = 'cancelled';
        job.dispute.resolution = 'refunded';
        break;
      
      case 'release':
        if (payment) await releasePayouts(payment._id);
        job.status = 'completed';
        job.dispute.resolution = 'released_to_worker';
        break;

      case 'dismiss':
        // Resume job
        job.status = 'in_progress';
        job.dispute.resolution = 'dismissed';
        break;

      default:
        return res.status(400).json({ message: 'Invalid resolution type' });
    }

    job.dispute.status = 'resolved';
    job.dispute.adminNote = adminNote;
    job.dispute.resolvedAt = new Date();
    
    await job.save();

    res.json({ message: `Dispute resolved: ${resolution}`, job });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resolving dispute', error: error.message });
  }
}
