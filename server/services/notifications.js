import Notification from '../models/Notification.js';
import { emitNotification } from './realtime.js';
import { sendEmail } from './email.js';
import User from '../models/User.js';

export async function notify({ userId, type, title, body, link, metadata = {}, channels = ['inapp'] }) {
  const note = await Notification.create({ user: userId, type, title, body, link, metadata, channels });
  emitNotification(userId, note);
  
  if (channels.includes('email')) {
    try {
      const user = await User.findById(userId);
      if (user && user.email) {
        
        let htmlBody = `<p>${body}</p>`;
        if (link) {
          htmlBody += `<p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}${link}" style="display: inline-block; padding: 10px 20px; background-color: #2563EB; color: #fff; text-decoration: none; border-radius: 5px;">View Details</a></p>`;
        }

        await sendEmail({
          to: user.email,
          subject: title,
          html: htmlBody
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
