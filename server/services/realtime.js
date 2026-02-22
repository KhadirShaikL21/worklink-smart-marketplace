import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import Job from '../models/Job.js';
import { notify } from './notifications.js';

let io;
const userSockets = new Map(); // userId -> Set<socketId>

// Simple Haversine Calculation (km)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      return next();
    } catch (err) {
      return next(new Error('Auth failed'));
    }
  });

  io.on('connection', socket => {
    if (!socket.userId) return;
    const set = userSockets.get(socket.userId) || new Set();
    set.add(socket.id);
    userSockets.set(socket.userId, set);

    socket.on('disconnect', () => {
      const s = userSockets.get(socket.userId);
      if (!s) return;
      s.delete(socket.id);
      if (s.size === 0) userSockets.delete(socket.userId);
    });

    // Job Tracking Events
    socket.on('join_job', (jobId) => {
      socket.join(`job:${jobId}`);
    });

    socket.on('leave_job', (jobId) => {
      socket.leave(`job:${jobId}`);
    });

    socket.on('update_location', async ({ jobId, location }) => {
      // Broadcast to everyone else in the job room (e.g. customer)
      socket.to(`job:${jobId}`).emit('worker_location', {
        workerId: socket.userId,
        location
      });

      // Geofencing Check
      try {
        // Find job - optimizing: maybe only search if en_route?
        const job = await Job.findById(jobId).select('location status isArrivalNotificationSent customer title startOtp');
        
        if (job && job.status === 'en_route' && !job.isArrivalNotificationSent) {
           const jobLat = job.location.coordinates[1]; // GeoJSON [lng, lat]
           const jobLng = job.location.coordinates[0];
           
           let workerLat, workerLng;
           if (Array.isArray(location)) {
             workerLat = location[0];
             workerLng = location[1];
           } else {
             workerLat = location.lat;
             workerLng = location.lng;
           }

           const distKm = calculateDistance(workerLat, workerLng, jobLat, jobLng);
           
           // Trigger if within 1km
           if (distKm <= 1.0) {
             console.log(`Worker arrived near job site (${distKm.toFixed(2)}km). Sending alert.`);
             
             // Update Flag first to prevent race conditions roughly
             await Job.findByIdAndUpdate(jobId, { isArrivalNotificationSent: true });
             
             // Notify Customer
             // Using direct notify function (careful with circular deps, but imports are static)
             await notify({
               userId: job.customer,
               type: 'job_update',
               title: 'Worker Arriving Soon!',
               body: `Your worker is within 1km of your location. Please execute OTP: ${job.startOtp} to verify arrival.`,
               link: `/jobs/${jobId}`,
               metadata: { jobId: job._id },
               channels: ['inapp', 'email']
             });

             // Also emit special event to frontend map to show "Arriving" badge?
             io.to(`job:${jobId}`).emit('worker_arriving', {
               message: 'Worker is arriving soon ( < 1km )'
             });
           }
        }
      } catch (err) {
        console.error('Geofencing error:', err);
      }
    });

    // Video Call Signaling
    socket.on('call:offer', ({ offer, to }) => {
      emitToUser(to, 'call:incoming', { offer, from: socket.userId });
    });

    socket.on('call:answer', ({ answer, to }) => {
      emitToUser(to, 'call:answered', { answer, from: socket.userId });
    });

    socket.on('call:ice-candidate', ({ candidate, to }) => {
      emitToUser(to, 'call:ice-candidate', { candidate, from: socket.userId });
    });

    socket.on('call:end', ({ to }) => {
      emitToUser(to, 'call:ended', { from: socket.userId });
    });

    socket.on('call:reject', ({ to }) => {
      emitToUser(to, 'call:rejected', { from: socket.userId });
    });
  });

  return io;
}

function emitToUser(userId, event, payload) {
  const sockets = userSockets.get(userId?.toString());
  if (!io || !sockets) return;
  for (const sid of sockets) {
    io.to(sid).emit(event, payload);
  }
}

export function emitChatMessage(userId, message) {
  emitToUser(userId, 'chat:message', message);
}

export function emitNotification(userId, notification) {
  emitToUser(userId, 'notification:new', notification);
}

export function getIo() {
  return io;
}
