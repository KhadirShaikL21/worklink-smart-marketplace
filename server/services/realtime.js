import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';

let io;
const userSockets = new Map(); // userId -> Set<socketId>

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

    socket.on('update_location', ({ jobId, location }) => {
      // Broadcast to everyone else in the job room (e.g. customer)
      socket.to(`job:${jobId}`).emit('worker_location', {
        workerId: socket.userId,
        location
      });
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
