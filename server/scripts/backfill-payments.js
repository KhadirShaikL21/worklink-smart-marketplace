import mongoose from 'mongoose';
import Job from '../models/Job.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/worklink';

async function backfillPayments() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all completed jobs without payment records
    const completedJobs = await Job.find({ 
      status: 'completed',
      assignedWorkers: { $exists: true, $ne: [] }
    }).populate('customer assignedWorkers');

    console.log(`Found ${completedJobs.length} completed jobs`);

    for (const job of completedJobs) {
      // Check if payment already exists
      const existingPayment = await Payment.findOne({ job: job._id });
      
      if (existingPayment) {
        console.log(`Job ${job._id} already has payment, skipping...`);
        continue;
      }

      // Create payment for this job
      const totalAmount = job.budget?.max || job.budget?.min || 500;
      const platformFeePct = 5;
      const platformFee = (totalAmount * platformFeePct) / 100;
      const netToWorkers = totalAmount - platformFee;
      const amountPerWorker = Math.floor(netToWorkers / job.assignedWorkers.length);

      const payees = job.assignedWorkers.map(worker => ({
        worker: worker._id,
        amount: amountPerWorker,
        status: 'released' // Mark as released since job is completed
      }));

      const payment = await Payment.create({
        job: job._id,
        payer: job.customer._id,
        payees: payees,
        platformFeePct: platformFeePct,
        total: totalAmount,
        currency: 'INR',
        status: 'captured',
        stripePaymentIntentId: `backfilled_${job._id}_${Date.now()}`,
        createdAt: job.timeline?.completedAt || job.updatedAt || new Date()
      });

      console.log(`✅ Created payment for job "${job.title}" (${job._id})`);
      console.log(`   Total: ₹${totalAmount}, Per Worker: ₹${amountPerWorker}, Workers: ${job.assignedWorkers.length}`);
    }

    console.log('\n✨ Backfill complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error backfilling payments:', error);
    process.exit(1);
  }
}

backfillPayments();
