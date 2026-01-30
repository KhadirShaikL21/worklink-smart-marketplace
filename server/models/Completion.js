import mongoose from 'mongoose';

const CompletionSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending_customer', 'satisfied', 'not_satisfied', 'needs_fix'], default: 'pending_customer' },
    customerNote: { type: String },
    workerNote: { type: String },
    auditLog: [
      {
        at: { type: Date, default: Date.now },
        action: String,
        actor: String,
        note: String
      }
    ]
  },
  { timestamps: true }
);

CompletionSchema.index({ job: 1, worker: 1 });

export default mongoose.model('Completion', CompletionSchema);
