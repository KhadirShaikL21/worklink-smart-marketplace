import User from '../models/User.js';
import Job from '../models/Job.js';
import Payment from '../models/Payment.js';
// import Dispute from '../models/Dispute.js'; // Assuming you have a Dispute model, if not I'll check

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

// Placeholder for disputes until model is confirmed
export async function getDisputes(req, res) {
    res.json({ disputes: [] }); 
}
