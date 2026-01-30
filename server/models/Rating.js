import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    punctuality: { type: Number, min: 1, max: 5, required: true },
    quality: { type: Number, min: 1, max: 5, required: true },
    professionalism: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, maxlength: 1200 },
    overall: { type: Number, min: 1, max: 5, required: true },
    createdFrom: { type: String, enum: ['completion', 'admin'], default: 'completion' }
  },
  { timestamps: true }
);

RatingSchema.index({ worker: 1, createdAt: -1 });
RatingSchema.index({ job: 1, worker: 1 });

export default mongoose.model('Rating', RatingSchema);
