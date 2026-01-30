import http from 'http';
import mongoose from 'mongoose';
import env from '../config/env.js';
import { createApp } from './app.js';
import { initRealtime } from '../services/realtime.js';

async function start() {
  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: true
    });
    console.log('Connected to Mongo');

    const app = createApp();
    const server = http.createServer(app);

    initRealtime(server);

    server.listen(env.port, () => {
      console.log(`Server running on ${env.serverUrl}`);
    });
  } catch (err) {
    console.error('Startup error', err);
    process.exit(1);
  }
}

start();
