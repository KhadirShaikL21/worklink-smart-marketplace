import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from '../routes/index.js';
import env from '../config/env.js';
import { notFound, errorHandler } from '../middleware/errorHandler.js';
import { handleStripeWebhook } from '../controllers/webhookController.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));

  // Stripe Webhook - must be before express.json()
  app.post('/api/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
