console.log("🔥 App.js loaded with webhook route");


// Express app configuration (ESM)
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import errorHandler from './middleware/error.middleware.js';

// Route imports
import { webhookRoutes, reelRoutes, healthRoutes } from './routes/index.js';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/health', healthRoutes);


// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;