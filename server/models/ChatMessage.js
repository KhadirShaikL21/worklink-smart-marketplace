import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, index: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String },
    audioUrl: { type: String },
    type: { type: String, enum: ['text', 'audio'], default: 'text' }
  },
  { timestamps: true }
);

ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model('ChatMessage', ChatMessageSchema);
