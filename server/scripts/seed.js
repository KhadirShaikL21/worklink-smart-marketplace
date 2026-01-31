import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Job from '../models/Job.js';
import Task from '../models/Task.js';
import Rating from '../models/Rating.js';
import Payment from '../models/Payment.js';

console.log('Seed script started...');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/worklink';
console.log('Using Mongo URI:', MONGO_URI);


// Common password hash for '123456'
// We'll pre-calculate it or bcrypt it in the script, 
// preferably just let User modal pre-save hook handle it if we create instances directly, 
// or hash it manually if using insertMany (which bypasses pre-save).
// To be safe and consistent with "Delete all data... add passwords as 123456", we will use the plain '123456' 
// and instantiate Users so the hook runs, OR manually hash it. 
// A manual hash is faster for bulk operations.
const SALT = bcrypt.genSaltSync(10);
const HASHED_PASSWORD_123456 = bcrypt.hashSync('123456', SALT);

// --- Sample Data ---

const workersData = [
  {
    name: 'Raj Plumber',
    email: 'raj.plumber@example.com',
    phone: '+919876543210',
    passwordHash: HASHED_PASSWORD_123456,
    roles: ['worker', 'customer'],
    isWorker: true,
    isCustomer: true,
    verification: { emailVerified: true, phoneVerified: true, identityVerified: true, adminApproved: true },
    profile: {
      title: 'Expert Residential Plumber',
      skills: ['plumbing', 'leak repair', 'pipe fitting', 'bathroom', 'kitchen'],
      experienceYears: 6,
      hourlyRate: 500,
      languages: ['en', 'hi', 'mr'],
      bio: 'Certified plumber specializing in leak fixes, bathroom fittings, and emergency pipe repairs. 6 years of experience in high-rise buildings and residential complexes.',
      location: { type: 'Point', coordinates: [72.8777, 19.076], radiusKm: 25 }, // Mumbai
      availability: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], hours: { start: '08:00', end: '20:00' } },
      toolsOwned: ['pipe wrench', 'plunger', 'pipe cutter', 'drill machine'],
      certifications: [{ label: 'City Plumbing Cert', url: 'https://placehold.co/400x300?text=Certificate' }]
    }
  },
  {
    name: 'Priya Electrician',
    email: 'priya.electrician@example.com',
    phone: '+919876543211',
    passwordHash: HASHED_PASSWORD_123456,
    roles: ['worker', 'customer'],
    isWorker: true,
    isCustomer: true,
    verification: { emailVerified: true, phoneVerified: true, identityVerified: true, adminApproved: true },
    profile: {
      title: 'Senior Electrician',
      skills: ['electrical', 'wiring', 'panel upgrade', 'lighting', 'fan install'],
      experienceYears: 8,
      hourlyRate: 650,
      languages: ['en', 'hi', 'kn'],
      bio: 'Handles home rewiring, fans, lights, and safety checks. Expert in fixing short circuits and installing smart home devices.',
      location: { type: 'Point', coordinates: [77.5946, 12.9716], radiusKm: 20 }, // Bangalore
      availability: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], hours: { start: '09:00', end: '19:00' } },
      toolsOwned: ['multimeter', 'tester', 'ladder', 'insulated pliers'],
      certifications: [{ label: 'Certified Residential Electrician', url: 'https://placehold.co/400x300?text=Certificate' }]
    }
  },
  {
    name: 'Aman Carpenter',
    email: 'aman.carpenter@example.com',
    phone: '+919876543212',
    passwordHash: HASHED_PASSWORD_123456,
    roles: ['worker', 'customer'],
    isWorker: true,
    isCustomer: true,
    verification: { emailVerified: true, phoneVerified: true, identityVerified: true, adminApproved: true },
    profile: {
      title: 'Master Carpenter',
      skills: ['carpentry', 'furniture repair', 'modular kitchen', 'door', 'wardrobe'],
      experienceYears: 12,
      hourlyRate: 700,
      languages: ['en', 'hi', 'pa'],
      bio: 'Custom furniture, repairs, and modular fittings. Specialist in space-saving furniture designs.',
      location: { type: 'Point', coordinates: [77.1025, 28.7041], radiusKm: 30 }, // Delhi
      availability: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], hours: { start: '10:00', end: '18:00' } },
      toolsOwned: ['drill', 'saw', 'sander', 'measuring tape'],
      certifications: []
    }
  },
  {
    name: 'Suresh Painter',
    email: 'suresh.painter@example.com',
    phone: '+919876543213',
    passwordHash: HASHED_PASSWORD_123456,
    roles: ['worker', 'customer'],
    isWorker: true,
    isCustomer: true,
    verification: { emailVerified: true, phoneVerified: true, identityVerified: false, adminApproved: true },
    profile: {
      title: 'Professional Painter',
      skills: ['painting', 'putty', 'waterproofing', 'texture'],
      experienceYears: 4,
      hourlyRate: 400,
      languages: ['en', 'hi', 'te'],
      bio: 'Interior/exterior paint, texture and waterproofing. Clean work with zero mess guarantee.',
      location: { type: 'Point', coordinates: [78.4867, 17.385], radiusKm: 20 }, // Hyderabad
      availability: { days: ['mon', 'wed', 'fri', 'sat', 'sun'], hours: { start: '09:00', end: '17:00' } },
      toolsOwned: ['rollers', 'brushes', 'scraper', 'ladder'],
      certifications: []
    }
  },
  {
    name: 'Anita Cleaning',
    email: 'anita.clean@example.com',
    phone: '+919876543214',
    passwordHash: HASHED_PASSWORD_123456,
    roles: ['worker', 'customer'],
    isWorker: true,
    isCustomer: true,
    verification: { emailVerified: true, phoneVerified: true, identityVerified: true, adminApproved: true },
    profile: {
      title: 'Deep Cleaning Specialist',
      skills: ['cleaning', 'deep clean', 'kitchen', 'sofa', 'bathroom'],
      experienceYears: 3,
      hourlyRate: 350,
      languages: ['hi', 'mr'],
      bio: 'Providing sparkling clean homes. Specialized in deep cleaning for festivals and moving-in/out.',
      location: { type: 'Point', coordinates: [72.8777, 19.076], radiusKm: 15 }, // Mumbai
      availability: { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], hours: { start: '07:00', end: '16:00' } },
      toolsOwned: ['vacuum cleaner', 'mop', 'cleaning solutions'],
      certifications: []
    }
  }
];

const customerData = [
  {
    name: 'Rahul Customer',
    email: 'rahul.customer@example.com',
    phone: '+919999999901',
    passwordHash: HASHED_PASSWORD_123456,
    roles: ['customer'],
    isWorker: false,
    isCustomer: true,
    verification: { emailVerified: true, phoneVerified: true }
  },
  {
    name: 'Sneha Customer',
    email: 'sneha.customer@example.com',
    phone: '+919999999902',
    passwordHash: HASHED_PASSWORD_123456,
    roles: ['customer'],
    isWorker: false,
    isCustomer: true,
    verification: { emailVerified: true, phoneVerified: true }
  },
  {
    name: 'Vikram Customer',
    email: 'vikram.customer@example.com',
    phone: '+919999999903',
    passwordHash: HASHED_PASSWORD_123456,
    roles: ['customer'],
    isWorker: false,
    isCustomer: true,
    verification: { emailVerified: true, phoneVerified: false }
  }
];

// --- Main Seed Function ---

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for Seeding...');

    // 1. Clear Database
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      WorkerProfile.deleteMany({}),
      Job.deleteMany({}),
      Task.deleteMany({}),
      Rating.deleteMany({}),
      Payment.deleteMany({})
    ]);

    // 2. Create Customers
    console.log('Creating Customers...');
    const createdCustomers = await User.insertMany(customerData);
    const customersMap = {}; // email -> userObject
    createdCustomers.forEach(c => customersMap[c.email] = c);

    // 3. Create Workers & Profiles
    console.log('Creating Workers & Profiles...');
    const createdWorkers = [];
    
    for (const wData of workersData) {
      const { profile, ...userData } = wData;
      // Create User
      const user = await User.create(userData);
      createdWorkers.push(user);
      
      // Create Profile
      await WorkerProfile.create({
        user: user._id,
        ...profile,
        completedJobs: 0, // Will update statistically later
        ratingStats: { average: 5.0, count: 0 } // Start fresh
      });
      user.workerProfile = profile; // Attach for reference later in script
    }

    // 4. Create Jobs & Scenarios
    console.log('Creating Jobs & Scenarios...');

    // Scenario A: Open Job (Plumbing in Mumbai)
    await Job.create({
      customer: customersMap['rahul.customer@example.com']._id,
      title: 'Fix Kitchen Sink Leak',
      category: 'plumbing',
      description: 'The kitchen sink pipe is leaking water continuously. Need someone to fix it ASAP.',
      skillsRequired: ['plumbing', 'leak repair'],
      location: { type: 'Point', coordinates: [72.8777, 19.076] },
      budget: { min: 400, max: 800, currency: 'INR' },
      urgency: 'high',
      status: 'open',
      hoursEstimate: 2,
      postedAt: new Date()
    });

    // Scenario B: Completed Job with Rating (Raj Plumber by Sneha)
    const completedJobWorker = createdWorkers.find(w => w.name === 'Raj Plumber');
    const completedJobCustomer = customersMap['sneha.customer@example.com'];
    
    if (completedJobWorker) {
       const job = await Job.create({
        customer: completedJobCustomer._id,
        title: 'Bathroom Tap Replacement',
        category: 'plumbing',
        description: 'Replace two old taps in the master bathroom.',
        skillsRequired: ['plumbing', 'bathroom'],
        location: { type: 'Point', coordinates: [72.88, 19.08] },
        budget: { min: 300, max: 600, currency: 'INR' },
        urgency: 'medium',
        status: 'completed',
        hoursEstimate: 1,
        assignedWorkers: [completedJobWorker._id],
        startOtp: '1234',
        completionProof: {
           imageUrls: [
             'https://placehold.co/600x400?text=Tap+Fixed+1',
             'https://placehold.co/600x400?text=Tap+Fixed+2',
             'https://placehold.co/600x400?text=Old+Tap'
           ]
        }
      });

      // Task
      await Task.create({
        job: job._id,
        worker: completedJobWorker._id,
        role: 'plumber',
        status: 'completed',
        payout: 500
      });

      // Rating
      await Rating.create({
        job: job._id,
        worker: completedJobWorker._id,
        customer: completedJobCustomer._id,
        punctuality: 5,
        quality: 5,
        professionalism: 4,
        overall: 4.6,
        review: 'Raj did a great job. He was on time and the taps are working perfectly now.'
      });

      // Update Worker Stats manually (since we are seeding directly)
      await WorkerProfile.updateOne(
        { user: completedJobWorker._id }, 
        { 
          $inc: { completedJobs: 1, 'ratingStats.count': 1 },
          $set: { 'ratingStats.average': 4.6 } 
        }
      );
      await User.updateOne({ _id: completedJobWorker._id }, { $set: { 'ratingStats.average': 4.6, 'ratingStats.count': 1 } });
    }

    // Scenario C: En Route Job (Priya Electrician for Rahul)
    const enRouteWorker = createdWorkers.find(w => w.name === 'Priya Electrician');
    if (enRouteWorker) {
      await Job.create({
        customer: customersMap['rahul.customer@example.com']._id,
        title: 'Install Ceiling Fan',
        category: 'electrical',
        description: 'New ceiling fan installation in the living room. Fan is already purchased.',
        skillsRequired: ['electrical', 'fan install'],
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        budget: { min: 300, max: 500, currency: 'INR' },
        urgency: 'medium',
        status: 'en_route',
        hoursEstimate: 1,
        assignedWorkers: [enRouteWorker._id],
        startOtp: '5678'
      });
      // Mark worker busy
      await WorkerProfile.updateOne({ user: enRouteWorker._id }, { isAvailable: false });
    }

    // Scenario D: In Progress Job (Aman Carpenter for Vikram)
    const inProgressWorker = createdWorkers.find(w => w.name === 'Aman Carpenter');
    if (inProgressWorker) {
      await Job.create({
        customer: customersMap['vikram.customer@example.com']._id,
        title: 'Repair Wardrobe Door',
        category: 'carpentry',
        description: 'The wardrobe door hinge is broken and needs replacement.',
        skillsRequired: ['carpentry', 'furniture repair'],
        location: { type: 'Point', coordinates: [77.1025, 28.7041] },
        budget: { min: 500, max: 1000, currency: 'INR' },
        urgency: 'low',
        status: 'in_progress',
        hoursEstimate: 3,
        assignedWorkers: [inProgressWorker._id],
        startOtp: '9012'
      });
      // Mark worker busy
      await WorkerProfile.updateOne({ user: inProgressWorker._id }, { isAvailable: false });
    }

     // Scenario E: Another Completed Job for Raj (to show multiple reviews)
    if (completedJobWorker) {
       const job2 = await Job.create({
        customer: customersMap['vikram.customer@example.com']._id,
        title: 'Fix Balcony Drain',
        category: 'plumbing',
        description: 'Water clogging in balcony drain.',
        skillsRequired: ['plumbing'],
        location: { type: 'Point', coordinates: [72.88, 19.08] },
        budget: { min: 400, max: 600, currency: 'INR' },
        status: 'completed',
        assignedWorkers: [completedJobWorker._id],
        completionProof: { imageUrls: ['https://placehold.co/600x400'] }
      });

      await Rating.create({
        job: job2._id,
        worker: completedJobWorker._id,
        customer: customersMap['vikram.customer@example.com']._id,
        punctuality: 4,
        quality: 5,
        professionalism: 5,
        overall: 4.8,
        review: 'Very professional behavior. Fixed the issue quickly.'
      });

      // Update avg (approximate for seed)
      await WorkerProfile.updateOne(
        { user: completedJobWorker._id }, 
        { 
          $inc: { completedJobs: 1, 'ratingStats.count': 1 },
          $set: { 'ratingStats.average': 4.7 } 
        }
      );
      await User.updateOne({ _id: completedJobWorker._id }, { $set: { 'ratingStats.average': 4.7, 'ratingStats.count': 2 } });
    }

    console.log('Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

seedDatabase();

