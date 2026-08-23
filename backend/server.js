import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { initDB } from './config/db.js';
import { ensureSampleHlsStreams } from './services/transcoder.js';
import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import { setupWatchPartySockets } from './sockets/watchPartySocket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer();

const PORT = process.env.PORT || 5000;

export const createApp = () => {
  const app = express();
  const uploadsPath = path.resolve(__dirname, '../uploads');
  const videosPath = path.resolve(__dirname, '../frontend/public/videos');

  app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(uploadsPath));
  app.use('/videos', express.static(videosPath));
  app.use('/api/auth', authRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.get('/api/health', (req, res) => {
    res.json({ status: 'online', app: 'FLIXIT Video Platform Engine', version: '1.0.0', timestamp: new Date() });
  });

  return app;
};

const app = createApp();
server.on('request', app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
});
setupWatchPartySockets(io);

// Startup Routine
const startServer = async () => {
  await initDB();
  ensureSampleHlsStreams(path.resolve(__dirname, '../uploads'));

  server.listen(PORT, () => {
    console.log(`🚀 FLIXIT Streaming Server running on http://localhost:${PORT}`);
  });
};

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  startServer();
}

export { app, server };
