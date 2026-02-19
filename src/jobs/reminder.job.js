// Background job for sending reminders
const { ReminderService } = require('../services/reminder.service');

class ReminderJob {
  static async processReminders() {
    try {
      // TODO: Implement reminder processing logic
      console.log('Processing reminders...');
    } catch (error) {
      console.error('Reminder job failed:', error);
    }
  }
}

module.exports = { ReminderJob };
