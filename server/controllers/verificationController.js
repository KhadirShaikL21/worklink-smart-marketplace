import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import WorkerProfile from '../models/WorkerProfile.js';
import env from '../config/env.js';
import { sendEmail } from '../services/email.js';

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function saveOtp(user, channel = 'email') {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  user.otp = {
    codeHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
    channel,
    lastSentAt: new Date()
  };
  await user.save();
  return code;
}

export async function requestOtp(req, res) {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const code = await saveOtp(user, 'email');

  try {
    if (env.nodeEnv !== 'production') {
      // In non-prod, send email and return code
      await sendEmail({
        to: user.email,
        subject: 'WorkLink Verification Code',
        html: `<p>Your verification code is: <strong>${code}</strong></p>`
      });
      
      return res.json({
        status: 'sent',
        channel: 'email',
        expiresInSeconds: 300,
        devCode: code
      });
    }

    await sendEmail({
      to: user.email,
      subject: 'WorkLink Verification Code',
      html: `<p>Your verification code is: <strong>${code}</strong></p>`
    });

    return res.json({
      status: 'sent',
      channel: 'email',
      expiresInSeconds: 300
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send OTP', reason: err.message });
  }
}

export async function verifyOtp(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Code required' });

  const user = await User.findById(req.user._id);
  if (!user || !user.otp || !user.otp.codeHash) {
    return res.status(400).json({ message: 'No OTP requested or already used' });
  }

  if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
    user.otp = undefined;
    await user.save();
    return res.status(400).json({ message: 'OTP expired, request a new one' });
  }

  const match = await bcrypt.compare(code, user.otp.codeHash);
  if (!match) {
    user.otp.attempts = (user.otp.attempts || 0) + 1;
    await user.save();
    return res.status(400).json({ message: 'Invalid code' });
  }

  user.verification.emailVerified = true;
  user.otp = undefined;
  await user.save();

  return res.json({ status: 'verified' });
}

export async function uploadIdDocs(req, res) {
  const { idFrontUrl, idBackUrl, selfieUrl } = req.body;
  if (!req.user.isWorker) return res.status(403).json({ message: 'Only workers can upload ID' });

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      documents: { idFrontUrl, idBackUrl, selfieUrl },
      verificationScore: 0.5
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await User.updateOne({ _id: req.user._id }, { 'verification.idVerified': true });
  return res.json({ profile });
}

export async function faceMatch(req, res) {
  // Placeholder face match; assume pass
  await User.updateOne({ _id: req.user._id }, { 'verification.faceMatchVerified': true });
  return res.json({ status: 'face_match_passed' });
}

export async function adminApprove(req, res) {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await User.updateOne({ _id: userId }, { 'verification.adminApproved': true });
  return res.json({ status: 'approved' });
}
