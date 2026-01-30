import mongoose from 'mongoose';

const ChatRoomSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { type: String, enum: ['direct', 'group'], default: 'group' }
  },
  { timestamps: true }
);

ChatRoomSchema.index({ job: 1 });

export default mongoose.model('ChatRoom', ChatRoomSchema);
