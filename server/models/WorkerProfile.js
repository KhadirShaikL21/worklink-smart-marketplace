import mongoose from 'mongoose';

const AvailabilitySchema = new mongoose.Schema(
  {
    days: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }],
    hours: {
      start: { type: String }, // "08:00"
      end: { type: String }
    },
    leaveDates: [{ type: Date }]
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [0, 0],
      validate: v => v.length === 2
    },
    radiusKm: { type: Number, default: 15 }
  },
  { _id: false }
);

const WorkerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    avatarUrl: { type: String, trim: true },
    title: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0, min: 0 },
    completedJobs: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    languages: [{ type: String, trim: true }],
    bio: { type: String, maxlength: 800 },
    location: { type: LocationSchema, default: () => ({}) },
    availability: { type: AvailabilitySchema, default: () => ({}) },
    toolsOwned: [{ type: String, trim: true }],
    certifications: [{ label: String, url: String }],
    documents: {
      idFrontUrl: String,
      idBackUrl: String,
      selfieUrl: String
    },
    portfolio: [
      {
        title: String,
        description: String,
        imageUrl: String
      }
    ],
    ratingStats: {
      average: { type: Number, default: 4.0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      lastUpdated: { type: Date }
    },
    completedJobs: { type: Number, default: 0 },
    successRate: { type: Number, default: 1.0, min: 0, max: 1 },
    verificationScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

WorkerProfileSchema.index({ location: '2dsphere' });
WorkerProfileSchema.index({ skills: 1, hourlyRate: 1 });
WorkerProfileSchema.index({ 'ratingStats.average': -1 });

export default mongoose.model('WorkerProfile', WorkerProfileSchema);
