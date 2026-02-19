import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, index: true },
    description: { type: String, required: true },
    skillsRequired: [{ type: String, index: true }],
    tasks: [{ type: String }],
    hoursEstimate: { type: Number, min: 0 },
    budget: {
      currency: { type: String, default: 'INR' },
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    toolsRequired: [{ type: String }],
    urgency: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'medium', index: true },
    workersNeeded: { type: Number, default: 1, min: 1 },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'assigned', 'accepted', 'en_route', 'in_progress', 'completed', 'disputed', 'cancelled'],
      default: 'open',
      index: true
    },
    startOtp: { type: String },
    assignedWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    applicants: [{
      worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      appliedAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
    }],
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    media: {
      beforeUrls: [String],
      afterUrls: [String],
      audioBriefUrls: [String],
      problemVideoUrl: { type: String }
    },
    completionProof: {
      videoUrl: { type: String },
      imageUrls: [{ type: String }]
    },
    preferences: {
      language: { type: String, default: 'en' },
      allowManualSelection: { type: Boolean, default: true },
      maxDistanceKm: { type: Number, default: 25 }
    },
    matchingSnapshot: {
      weights: Object,
      rankedCandidates: [Object]
    },
    timeline: {
      assignedAt: { type: Date },
      travelStartedAt: { type: Date },
      startedAt: { type: Date },
      completedAt: { type: Date }
    },
    summary: {
      travelDurationMinutes: { type: Number, min: 0 },
      workDurationMinutes: { type: Number, min: 0 },
      totalDurationMinutes: { type: Number, min: 0 }
    }
  },
  { timestamps: true }
);

JobSchema.index({ location: '2dsphere' });
JobSchema.index({ status: 1, urgency: 1 });

export default mongoose.model('Job', JobSchema);
