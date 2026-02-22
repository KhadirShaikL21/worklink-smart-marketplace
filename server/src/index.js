import http from 'http';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import env from '../config/env.js';
import { initRealtime } from '../services/realtime.js';

// Handle unhandled Promise rejections
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

async function start() {
  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: true
    });
    console.log('Connected to Mongo');

    const app = createApp();
    const server = http.createServer(app);

    initRealtime(server);

    const port = env.port;
    server.listen(port, () => {
      console.log(`Server running on ${env.serverUrl || 'http://localhost:' + port}`);
    });

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${port} is already in use!`);
        console.error(`Please kill the process running on port ${port} and restart.`);
        process.exit(1);
      } else {
        console.error('Server error:', e);
      }
    });

  } catch (err) {
    console.error('Startup error', err);
    process.exit(1);
  }
}

start();
