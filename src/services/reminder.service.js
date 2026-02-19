// Reminder service for scheduled messages (ESM)
import twilioClient from '../config/twilio.js';

class ReminderService {
  static async sendReminder(phoneNumber, message) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE,
        to: phoneNumber,
      });
    } catch (error) {
      throw new Error(`Reminder send failed: ${error.message}`);
    }
  }
}

export { ReminderService };
