import ChatMessage from '../models/ChatMessage.js';
import ChatRoom from '../models/ChatRoom.js';
import { emitChatMessage } from '../services/realtime.js';

function buildConversationId(a, b) {
  return [a.toString(), b.toString()].sort().join('::');
}

export async function sendMessage(req, res) {
  const { to, roomId, body, audioUrl, type = 'text' } = req.body;
  if (!roomId && !to) return res.status(400).json({ message: 'Recipient or room required' });
  if (type === 'text' && !body) return res.status(400).json({ message: 'Body required' });
  if (type === 'audio' && !audioUrl) return res.status(400).json({ message: 'audioUrl required' });

  let targetIds = [];
  let conversationId = null;
  let room = null;

  if (roomId) {
    room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    // Verify user is a participant
    const isParticipant = room.participants.some(p => p.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this room' });
    }

    targetIds = room.participants.map(p => p.toString());
  } else {
    targetIds = [to.toString()];
    conversationId = buildConversationId(req.user._id, to);
  }

  const recipients = targetIds.filter(id => id !== req.user._id.toString());
  const msg = await ChatMessage.create({
    conversationId,
    room: room?._id,
    from: req.user._id,
    to: to || recipients[0],
    body,
    audioUrl,
    type
  });

  for (const rid of recipients) {
    emitChatMessage(rid, msg);
  }
  emitChatMessage(req.user._id, msg);

  return res.status(201).json({ message: msg });
}

export async function listMessages(req, res) {
  const { withUser, roomId } = req.query;
  let filter = null;
  if (roomId) {
    filter = { room: roomId };
  } else if (withUser) {
    const conversationId = buildConversationId(req.user._id, withUser);
    filter = { conversationId };
  }
  if (!filter) return res.status(400).json({ message: 'withUser or roomId required' });

  const msgs = await ChatMessage.find(filter).sort({ createdAt: -1 }).limit(100);
  return res.json({ messages: msgs });
}

export async function listRooms(req, res) {
  try {
    const rooms = await ChatRoom.find({ participants: req.user._id })
      .populate('job', 'title status')
      .populate('participants', 'name avatarUrl')
      .sort({ updatedAt: -1 });
    return res.json({ rooms });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch chat rooms' });
  }
}
