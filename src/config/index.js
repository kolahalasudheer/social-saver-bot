// Configuration exports (ESM)
import pool from './db.js';
import twilioClient from './twilio.js';
import { getAIClient } from './ai.js';

export {
  pool,
  twilioClient,
  getAIClient,
};
