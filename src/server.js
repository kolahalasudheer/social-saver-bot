import dotenv from "dotenv";
dotenv.config(); // MUST be first line
console.log("SID from server:", process.env.TWILIO_ACCOUNT_SID);


import app from './app.js';
import { Logger } from './utils/logger.js';
import { startReminderJob } from './jobs/reminder.job.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  Logger.info(`Server started on port ${PORT}`);
  startReminderJob(); // 🔔 Start reminder cron
});

process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, closing server...');
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

export default server;
