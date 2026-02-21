import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address: node scripts/make-admin.js <email>');
  process.exit(1);
}

async function promoteToAdmin() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGO_URI is undefined in .env file');
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    if (!user.roles.includes('admin')) {
      user.roles.push('admin');
      // Verify them automatically if they are admin
      if (!user.verification) user.verification = {};
      user.verification.adminApproved = true;
      user.verification.idVerified = true;
      user.verification.emailVerified = true;
      
      await user.save();
      console.log(`SUCCESS: User ${user.name} (${email}) is now an ADMIN.`);
    } else {
      console.log(`User ${user.name} (${email}) is ALREADY an admin.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

promoteToAdmin();
