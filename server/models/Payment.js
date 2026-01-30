import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    payees: [
      {
        worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, min: 0, required: true },
        status: { type: String, enum: ['pending', 'released', 'failed'], default: 'pending' }
      }
    ],
    platformFeePct: { type: Number, default: 5, min: 0, max: 5 },
    total: { type: Number, min: 0, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'captured', 'refunded'], default: 'pending' },
    stripePaymentIntentId: { type: String },
    clientSecret: { type: String },
    invoiceUrl: { type: String }
  },
  { timestamps: true }
);

PaymentSchema.index({ job: 1 });

export default mongoose.model('Payment', PaymentSchema);
