import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Job from '../models/Job.js';
import Task from '../models/Task.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/worklink';

const workersData = [
  {
    name: 'Raj Plumber',
    email: 'raj.plumber@example.com',
    phone: '+910000000001',
    password: 'Password123',
    roles: ['worker', 'customer'],
    isWorker: true,
    isCustomer: true,
    profile: {
      title: 'Plumber & Pipe Fitter',
      skills: ['plumbing', 'leak repair', 'pipe fitting'],
      experienceYears: 6,
      hourlyRate: 12,
      languages: ['en', 'hi'],
      bio: 'Certified plumber specializing in leak fixes and bathroom fittings.',
      location: { type: 'Point', coordinates: [72.8777, 19.076], radiusKm: 25 }, // Mumbai
      availability: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], hours: { start: '08:00', end: '18:00' } },
      toolsOwned: ['pipe wrench', 'plunger', 'pipe cutter'],
      certifications: [{ label: 'City Plumbing Cert', url: '' }]
    }
  },
  {
    name: 'Priya Electrician',
    email: 'priya.electrician@example.com',
    phone: '+910000000002',
    password: 'Password123',
    roles: ['worker', 'customer'],
    isWorker: true,
    isCustomer: true,
    profile: {
      title: 'Residential Electrician',
      skills: ['electrical', 'wiring', 'panel upgrade'],
      experienceYears: 5,
      hourlyRate: 14,
      languages: ['en', 'hi'],
      bio: 'Handles home rewiring, fans, lights, and safety checks.',
      location: { type: 'Point', coordinates: [77.5946, 12.9716], radiusKm: 20 }, // Bangalore
      availability: { days: ['mon', 'tue', 'wed', 'thu', 'sat'], hours: { start: '09:00', end: '19:00' } },
      toolsOwned: ['multimeter', 'tester', 'ladder'],
      certifications: [{ label: 'Certified Residential Electrician', url: '' }]
    }
  },
  {
    name: 'Aman Carpenter',
    email: 'aman.carpenter@example.com',
    phone: '+910000000003',
    password: 'Password123',
    roles: ['worker', 'customer'],
    isWorker: true,
    isCustomer: true,
    profile: {
      title: 'Carpenter & Furniture Maker',
      skills: ['carpentry', 'furniture repair', 'modular'],
      experienceYears: 8,
      hourlyRate: 15,
      languages: ['en', 'hi'],
      bio: 'Custom furniture, repairs, and modular fittings.',
      location: { type: 'Point', coordinates: [77.1025, 28.7041], radiusKm: 30 }, // Delhi
      availability: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], hours: { start: '10:00', end: '18:00' } },
      toolsOwned: ['drill', 'saw', 'sander'],
      certifications: []
    }
  },
  {
    name: 'Suresh Painter',
    email: 'suresh.painter@example.com',
    phone: '+910000000004',
    password: 'Password123',
    roles: ['worker', 'customer'],
    isWorker: true,
    isCustomer: true,
    profile: {
      title: 'Interior Painter',
      skills: ['painting', 'putty', 'waterproofing'],
      experienceYears: 4,
      hourlyRate: 11,
      languages: ['en', 'hi'],
      bio: 'Interior/exterior paint, texture and waterproofing.',
      location: { type: 'Point', coordinates: [78.4867, 17.385], radiusKm: 20 }, // Hyderabad
      availability: { days: ['mon', 'wed', 'fri', 'sat'], hours: { start: '09:00', end: '17:00' } },
      toolsOwned: ['rollers', 'brushes', 'scraper'],
      certifications: []
    }
  }
];

const customerData = {
  name: 'Test Customer',
  email: 'customer@example.com',
  phone: '+910000000010',
  password: 'Password123',
  roles: ['customer'],
  isWorker: false,
  isCustomer: true
};

const jobTemplates = [
  {
    title: 'Fix kitchen sink leak',
    category: 'plumbing',
    description: 'Leak under the sink, needs sealing and pipe check.',
    skillsRequired: ['plumbing', 'leak repair'],
    tasks: ['Inspect leak', 'Replace washer', 'Seal joints'],
    hoursEstimate: 2,
    budget: { currency: 'INR', min: 700, max: 1500 },
    toolsRequired: ['wrench', 'sealant'],
    urgency: 'high',
    location: { type: 'Point', coordinates: [72.878, 19.08] },
    assignedWorkerSkill: 'plumbing'
  },
  {
    title: 'Install ceiling fan and wiring check',
    category: 'electrical',
    description: 'Replace old fan and verify wiring safety.',
    skillsRequired: ['electrical', 'wiring'],
    tasks: ['Remove old fan', 'Install new fan', 'Check connections'],
    hoursEstimate: 3,
    budget: { currency: 'INR', min: 1200, max: 2500 },
    toolsRequired: ['multimeter', 'screwdriver'],
    urgency: 'medium',
    location: { type: 'Point', coordinates: [77.6, 12.97] },
    assignedWorkerSkill: 'electrical'
  },
  {
    title: 'Repair wardrobe hinge and repaint door',
    category: 'carpentry',
    description: 'Wardrobe door sagging; fix hinge and repaint.',
    skillsRequired: ['carpentry', 'painting'],
    tasks: ['Fix hinge', 'Sand surface', 'Apply paint'],
    hoursEstimate: 4,
    budget: { currency: 'INR', min: 1500, max: 3000 },
    toolsRequired: ['drill', 'paint roller'],
    urgency: 'medium',
    location: { type: 'Point', coordinates: [77.1, 28.7] },
    assignedWorkerSkill: 'carpentry'
  }
];

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Mongo');

  const emails = [customerData.email, ...workersData.map(w => w.email)];

  // Remove only prior seeded jobs (matched by title + seed customer) to avoid wiping user-created data
  const existingUsers = await User.find({ email: { $in: emails } });
  const sampleTitles = jobTemplates.map(j => j.title);
  const seedCustomer = existingUsers.find(u => u.email === customerData.email);
  if (seedCustomer) {
    const sampleJobs = await Job.find({ customer: seedCustomer._id, title: { $in: sampleTitles } }).select('_id');
    const sampleJobIds = sampleJobs.map(j => j._id);
    if (sampleJobIds.length) {
      await Task.deleteMany({ job: { $in: sampleJobIds } });
      await Job.deleteMany({ _id: { $in: sampleJobIds } });
    }
  }

  // Upsert customer
  let customer = await User.findOne({ email: customerData.email });
  if (!customer) {
    customer = new User({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      passwordHash: customerData.password,
      roles: customerData.roles,
      isWorker: customerData.isWorker,
      isCustomer: customerData.isCustomer,
      verification: { emailVerified: true }
    });
  } else {
    customer.name = customerData.name;
    customer.phone = customerData.phone;
    customer.roles = customerData.roles;
    customer.isWorker = customerData.isWorker;
    customer.isCustomer = customerData.isCustomer;
    customer.passwordHash = customerData.password; // will hash on save
    customer.verification = { ...customer.verification, emailVerified: true };
  }
  await customer.save();

  // Upsert workers and profiles
  const workers = [];
  for (const w of workersData) {
    let user = await User.findOne({ email: w.email });
    if (!user) {
      user = new User({
        name: w.name,
        email: w.email,
        phone: w.phone,
        passwordHash: w.password,
        roles: w.roles,
        isWorker: w.isWorker,
        isCustomer: w.isCustomer,
        verification: { emailVerified: true, adminApproved: true }
      });
    } else {
      user.name = w.name;
      user.phone = w.phone;
      user.roles = w.roles;
      user.isWorker = w.isWorker;
      user.isCustomer = w.isCustomer;
      user.passwordHash = w.password;
      user.verification = { ...user.verification, emailVerified: true, adminApproved: true };
    }
    await user.save();

    const profile = await WorkerProfile.findOneAndUpdate(
      { user: user._id },
      { user: user._id, ...w.profile },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    workers.push({ user, profile });
  }

  // Create sample jobs
  const jobs = [];
  for (const jt of jobTemplates) {
    const worker = workers.find(w => w.profile.skills.includes(jt.assignedWorkerSkill));
    const assignedWorkerId = worker ? worker.user._id : undefined;
    const job = await Job.create({
      customer: customer._id,
      title: jt.title,
      category: jt.category,
      description: jt.description,
      skillsRequired: jt.skillsRequired,
      tasks: jt.tasks,
      hoursEstimate: jt.hoursEstimate,
      budget: jt.budget,
      toolsRequired: jt.toolsRequired,
      urgency: jt.urgency,
      location: jt.location,
      status: assignedWorkerId ? 'assigned' : 'open',
      assignedWorkers: assignedWorkerId ? [assignedWorkerId] : []
    });

    if (assignedWorkerId) {
      await Task.create({
        job: job._id,
        worker: assignedWorkerId,
        role: jt.category,
        status: 'pending',
        payout: jt.budget.max
      });
    }

    jobs.push(job);
  }

  console.log(`Seeded: ${workers.length} workers, 1 customer, ${jobs.length} jobs.`);
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
