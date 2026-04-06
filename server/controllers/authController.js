import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { requestOtp as verificationRequestOtp } from './verificationController.js';
import WorkerProfile from '../models/WorkerProfile.js';
import Rating from '../models/Rating.js';
import { sendEmail } from '../services/email.js';
import bcrypt from 'bcryptjs';

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
}

function buildTokens(user) {
  const payload = { sub: user._id.toString(), roles: user.roles };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}

async function sendVerificationEmail(user, saveOtp = true) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  
  if (saveOtp) {
    user.otp = {
      codeHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      channel: 'email',
      lastSentAt: new Date()
    };
  }

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your WorkLink Account',
      html: `
        <h2>Welcome to WorkLink!</h2>
        <p>Please verify your email address to continue.</p>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 5 minutes.</p>
      `
    });
    return code;
  } catch (err) {
    console.error('Email send failed:', err.message);
    throw err;
  }
}

export async function register(req, res) {
  const errorResponse = handleValidation(req, res);
  if (errorResponse) return errorResponse;

  const { name, email, phone, password, isWorker, profile } = req.body;

  let profileData = profile || {};
  if (typeof profile === 'string') {
    try {
      profileData = JSON.parse(profile);
    } catch (e) {
      profileData = {};
    }
  }

  const exists = await User.findOne({ $or: [{ email }, { phone }] });
  if (exists) return res.status(400).json({ message: 'User already exists' });

  // Properly parse isWorker: FormData sends as string "true"/"false", not boolean
  const isWorkerBool = isWorker === true || isWorker === 'true';

  const user = new User({
    name,
    email,
    phone,
    passwordHash: password,
    roles: isWorkerBool ? ['worker'] : ['customer'],
    isWorker: isWorkerBool,
    isCustomer: !isWorkerBool,
    avatarUrl: req.file ? req.file.path : undefined
  });

  // Prepare OTP before saving
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpCodeHash = await bcrypt.hash(otpCode, 10);
  user.otp = {
    codeHash: otpCodeHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
    channel: 'email',
    lastSentAt: new Date()
  };

  // **SINGLE SAVE** with all user data
  await user.save();

  // Build tokens
  const { accessToken, refreshToken } = buildTokens(user);
  user.refreshTokens.push({ token: refreshToken });
  
  // **SINGLE UPDATE** to add refresh token
  await User.updateOne({ _id: user._id }, { refreshTokens: user.refreshTokens });

  // Send worker profile update in background (don't wait)
  if (isWorkerBool) {
    const skills = (profileData.skills || []).filter(Boolean);
    WorkerProfile.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        title: profileData.title || '',
        skills,
        experienceYears: Number(profileData.experienceYears) || 0,
        hourlyRate: Number(profileData.hourlyRate) || 0,
        languages: profileData.languages || [],
        bio: profileData.bio || '',
        location: profileData.location || undefined,
        toolsOwned: profileData.toolsOwned || []
      },
      { upsert: true, setDefaultsOnInsert: true }
    ).catch(err => console.error('WorkerProfile update failed:', err));
  }

  // **Send email asynchronously** (don't block response)
  sendEmail({
    to: user.email,
    subject: 'Verify your WorkLink Account',
    html: `
      <h2>Welcome to WorkLink!</h2>
      <p>Please verify your email address to continue.</p>
      <p>Your verification code is: <strong>${otpCode}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `
  }).then(() => {
    console.log(`✅ Verification email sent to ${user.email}`);
  }).catch(err => {
    console.error(`❌ Failed to send verification email to ${user.email}: ${err.message}`);
  });

  return res.status(201).json({
    message: 'Registration successful. Check your email for verification code.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      verification: user.verification,
      roles: user.roles,
      isWorker: user.isWorker,
      isCustomer: user.isCustomer,
      avatarUrl: user.avatarUrl
    },
    accessToken,
    refreshToken
  });
}

export async function login(req, res) {
  const errorResponse = handleValidation(req, res);
  if (errorResponse) return errorResponse;

  const { emailOrPhone, password } = req.body;
  const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await user.comparePassword(password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  if (user.status === 'banned' || user.status === 'suspended') {
    return res.status(403).json({ 
      message: `Account is ${user.status}. Reason: ${user.blockedReason || 'Violation of terms'}` 
    });
  }

  const { accessToken, refreshToken } = buildTokens(user);
  user.lastLoginAt = new Date();
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      verification: user.verification,
      roles: user.roles,
      isWorker: user.isWorker,
      isCustomer: user.isCustomer
    },
    accessToken,
    refreshToken
  });
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!tokenExists) return res.status(401).json({ message: 'Token revoked' });

    const { accessToken, refreshToken: newRefresh } = buildTokens(user);
    user.refreshTokens.push({ token: newRefresh });
    await user.save();

    return res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', reason: err.message });
  }
}

export async function me(req, res) {
  const profile = await WorkerProfile.findOne({ user: req.user._id }).select('avatarUrl title skills experienceYears hourlyRate bio isAvailable completedJobs badges ratingStats');
  
  // Fetch reviews for workers
  const reviews = await Rating.find({ worker: req.user._id })
    .populate('customer', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .limit(50);
  
  const user = req.user.toObject();
  
  // Ensure bankDetails is included
  if (!user.bankDetails) {
    user.bankDetails = {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      upiId: ''
    };
  }
  
  // Add reviews to user object
  user.reviews = reviews.map(r => ({
    id: r._id,
    reviewerName: r.customer?.name || 'Anonymous',
    reviewerAvatar: r.customer?.avatarUrl,
    rating: r.overall,
    comment: r.review,
    date: r.createdAt
  }));
  
  if (profile) {
    if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
    user.workerProfile = {
      title: profile.title,
      skills: profile.skills,
      experienceYears: profile.experienceYears,
      hourlyRate: profile.hourlyRate,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      isAvailable: profile.isAvailable,
      completedJobs: profile.completedJobs,
      badges: profile.badges,
      ratingStats: profile.ratingStats
    };
  }
  return res.json({ user });
}

export async function logout(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken || !req.user) return res.status(200).json({ message: 'Logged out' });
  await User.updateOne(
    { _id: req.user._id },
    { $pull: { refreshTokens: { token: refreshToken } } }
  );
  return res.json({ message: 'Logged out' });
}

export async function updateMe(req, res) {
  const { name, phone, avatarUrl, title, bio, skills, hourlyRate, experienceYears, bankDetails } = req.body;
  
  const userUpdates = {};
  if (name) userUpdates.name = name;
  if (phone) userUpdates.phone = phone;
  if (avatarUrl) userUpdates.avatarUrl = avatarUrl;
  if (bankDetails) {
    // Merge bank details properly
    const existingBankDetails = req.user.bankDetails || {};
    userUpdates.bankDetails = {
      accountHolderName: bankDetails.accountHolderName !== undefined ? bankDetails.accountHolderName : existingBankDetails.accountHolderName,
      accountNumber: bankDetails.accountNumber !== undefined ? bankDetails.accountNumber : existingBankDetails.accountNumber,
      bankName: bankDetails.bankName !== undefined ? bankDetails.bankName : existingBankDetails.bankName,
      ifscCode: bankDetails.ifscCode !== undefined ? bankDetails.ifscCode : existingBankDetails.ifscCode,
      upiId: bankDetails.upiId !== undefined ? bankDetails.upiId : existingBankDetails.upiId
    };
  }
  
  const user = await User.findByIdAndUpdate(req.user._id, { $set: userUpdates }, { new: true, runValidators: true });
  
  if (user.roles.includes('worker')) {
    const workerUpdates = {};
    if (title !== undefined) workerUpdates.title = title;
    if (bio !== undefined) workerUpdates.bio = bio;
    if (hourlyRate !== undefined) workerUpdates.hourlyRate = Number(hourlyRate);
    if (experienceYears !== undefined) workerUpdates.experienceYears = Number(experienceYears);
    if (skills !== undefined) workerUpdates.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    if (avatarUrl) workerUpdates.avatarUrl = avatarUrl;
    
    await WorkerProfile.findOneAndUpdate({ user: user._id }, workerUpdates, { upsert: true });
  }
  
  // Fetch complete user data with workerProfile for response
  const profile = await WorkerProfile.findOne({ user: user._id }).select('avatarUrl title skills experienceYears hourlyRate bio isAvailable completedJobs badges ratingStats');
  const userObj = user.toObject();
  
  if (profile) {
    if (!userObj.avatarUrl && profile.avatarUrl) userObj.avatarUrl = profile.avatarUrl;
    userObj.workerProfile = {
      title: profile.title,
      skills: profile.skills,
      experienceYears: profile.experienceYears,
      hourlyRate: profile.hourlyRate,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      isAvailable: profile.isAvailable,
      completedJobs: profile.completedJobs,
      badges: profile.badges,
      ratingStats: profile.ratingStats
    };
  }
  
  return res.json({ user: userObj });
}

// Placeholder for OTP flow to be implemented with provider
export async function requestOtp(req, res) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  return verificationRequestOtp(req, res);
}
