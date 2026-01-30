import { listNotifications, markRead } from '../services/notifications.js';

export async function getNotifications(req, res) {
  const notes = await listNotifications(req.user._id);
  return res.json({ notifications: notes });
}

export async function markNotificationRead(req, res) {
  const { id } = req.params;
  const note = await markRead(req.user._id, id);
  if (!note) return res.status(404).json({ message: 'Not found' });
  return res.json({ notification: note });
}
