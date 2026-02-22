console.log("🔥 App.js loaded with webhook route");

// Express app configuration (ESM)
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/error.middleware.js';

// Route imports
import { webhookRoutes, reelRoutes, healthRoutes, proxyRoutes } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Serve dashboard (mobile-first frontend)
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/proxy', proxyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
