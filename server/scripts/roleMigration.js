import mongoose from 'mongoose';
import '../config/env.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import WorkerProfile from '../models/WorkerProfile.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Role Migration: Connected to MongoDB');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const migrateRoles = async () => {
  await connectDB();

  try {
    const users = await User.find({});
    console.log(`Found ${users.length} users to process.`);

    let workerCount = 0;
    let customerCount = 0;

    for (const user of users) {
      const userId = user._id;

      // Check if user is assigned to any job (Worker Indicator)
      const assignedJobsCount = await Job.countDocuments({ assignedWorkers: userId });
      
      // Check if user has posted any job (Customer Indicator)
      const postedJobsCount = await Job.countDocuments({ customer: userId });

      // Check if user has a worker profile
      const hasWorkerProfile = await WorkerProfile.exists({ user: userId });

      let newRole = 'customer';
      
      if (assignedJobsCount > 0) {
        newRole = 'worker';
      } else if (postedJobsCount > 0) {
        newRole = 'customer';
      } else if (hasWorkerProfile) {
        newRole = 'worker';
      } else {
        // Fallback: preserve existing 'isWorker' flag if set, otherwise customer
        newRole = user.isWorker ? 'worker' : 'customer';
      }

      if (newRole === 'worker') {
        user.roles = ['worker'];
        user.isWorker = true;
        user.isCustomer = false;
        workerCount++;
      } else {
        user.roles = ['customer'];
        user.isWorker = false;
        user.isCustomer = true;
        customerCount++;
      }

      await user.save();
      // console.log(`User ${user.email} -> ${newRole}`);
    }

    console.log(`Migration Complete.`);
    console.log(`Workers: ${workerCount}`);
    console.log(`Customers: ${customerCount}`);

  } catch (err) {
    console.error('Migration Failed:', err);
  } finally {
    mongoose.connection.close();
    process.exit();
  }
};

migrateRoles();
