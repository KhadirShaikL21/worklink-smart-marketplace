import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const VerificationSchema = new mongoose.Schema(
  {
    emailVerified: { type: Boolean, default: false },
    idVerified: { type: Boolean, default: false },
    faceMatchVerified: { type: Boolean, default: false },
    adminApproved: { type: Boolean, default: false }
  },
  { _id: false }
);

const OtpSchema = new mongoose.Schema(
  {
    codeHash: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 },
    channel: { type: String, default: 'email' },
    lastSentAt: { type: Date }
  },
  { _id: false }
);

const RatingStatsSchema = new mongoose.Schema(
  {
    average: { type: Number, default: 4.0, min: 0, max: 5 }, // cold-start neutral
    count: { type: Number, default: 0 },
    punctualityAvg: { type: Number, default: 4.0, min: 0, max: 5 },
    qualityAvg: { type: Number, default: 4.0, min: 0, max: 5 },
    professionalismAvg: { type: Number, default: 4.0, min: 0, max: 5 }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['customer'] }, // customer, worker, admin
    status: { type: String, enum: ['active', 'banned', 'suspended'], default: 'active' },
    blockedReason: { type: String },
    isWorker: { type: Boolean, default: false },
    isCustomer: { type: Boolean, default: true },
    verification: { type: VerificationSchema, default: () => ({}) },
    otp: { type: OtpSchema, default: undefined },
    ratingStats: { type: RatingStatsSchema, default: () => ({}) },
    avatarUrl: { type: String },
    lastLoginAt: { type: Date },
    deviceFingerprint: { type: String },
    refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }]
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ 'verification.adminApproved': 1 });

export default mongoose.model('User', UserSchema);
