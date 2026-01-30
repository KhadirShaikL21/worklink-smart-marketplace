import Notification from '../models/Notification.js';
import { emitNotification } from './realtime.js';
import { sendEmail } from './email.js';
import User from '../models/User.js';

export async function notify({ userId, type, title, body, metadata = {}, channels = ['inapp'] }) {
  const note = await Notification.create({ user: userId, type, title, body, metadata, channels });
  emitNotification(userId, note);
  
  if (channels.includes('email')) {
    try {
      const user = await User.findById(userId);
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: title,
          html: `<p>${body}</p>`
        });
      }
    } catch (err) {
      console.error('Failed to send email notification:', err);
    }
  }
  
  return note;
}

export async function listNotifications(userId) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(100);
}

export async function markRead(userId, notificationId) {
  return Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { read: true }, { new: true });
}
