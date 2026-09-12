import dns from 'dns';

// Ensure reliable DNS resolution regardless of local DHCP misconfigurations
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

import express from 'express';
import cors from 'cors';
import config from './config/environment';
import { connectDB } from './config/db';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// CORS Configuration - restrict to trusted frontend origin
const allowedOrigins = [config.frontendUrl, 'http://localhost:3000', 'http://localhost:3001'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json());

// Master API Routes
app.use('/api', apiRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CareKare API Backend',
    version: '0.1.0',
    status: 'online',
    healthCheck: '/api/health',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, async () => {
    console.log(`[CareKare Backend] Server listening on http://localhost:${config.port}`);
    console.log(`[CareKare Backend] Health check: http://localhost:${config.port}/api/health`);
    console.log(`[CareKare Backend] Allowed frontend origin: ${config.frontendUrl}`);

    // Attempt MongoDB Atlas connection (graceful fallback if URI not configured)
    await connectDB();
  });
}

export default app;
