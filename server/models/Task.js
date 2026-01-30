import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true }, // e.g., plumber, electrician
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'rework'],
      default: 'pending'
    },
    startAt: { type: Date },
    endAt: { type: Date },
    payout: { type: Number, min: 0 },
    notes: String
  },
  { timestamps: true }
);

TaskSchema.index({ job: 1, worker: 1 });

export default mongoose.model('Task', TaskSchema);
