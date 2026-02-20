// reminder.job.js — ESM cron that fires due reminders every minute
import { getDueReminders, markReminderSent } from '../services/reel.repository.js';
import { sendWhatsAppMessage } from '../services/twilio.service.js';

function buildReminderMessage(rem) {
  const reelLink = rem.canonical_url || rem.url || '';
  const category = rem.category ? `[${rem.category}]` : '';
  const username = rem.username ? `@${rem.username}` : '';
  const summary = rem.summary
    ? `\n📝 "${rem.summary}"`
    : '';
  const note = rem.note
    ? `\n💬 Your note: ${rem.note}`
    : '';

  return (
    `⏰ *Reminder!* You asked me to ping you about this reel:\n\n` +
    `${category} ${username}${summary}${note}\n\n` +
    `▶️ Watch it here:\n${reelLink}`
  ).trim();
}

async function processReminders() {
  try {
    const due = await getDueReminders();
    if (due.length === 0) return;

    console.log(`[ReminderJob] 🔔 ${due.length} reminder(s) due`);

    for (const rem of due) {
      try {
        const message = buildReminderMessage(rem);
        await sendWhatsAppMessage({ to: rem.user_phone, body: message });
        await markReminderSent(rem.reminder_id, 'sent');
        console.log(`[ReminderJob] ✅ Sent to ${rem.user_phone} for ${rem.shortcode}`);
      } catch (err) {
        console.error(`[ReminderJob] ❌ Failed for reminder ${rem.reminder_id}:`, err.message);
        await markReminderSent(rem.reminder_id, 'failed');
      }
    }
  } catch (err) {
    console.error('[ReminderJob] Fatal error:', err.message);
  }
}

// Start polling every 60 seconds
export function startReminderJob() {
  console.log('[ReminderJob] ✅ Started — checking every 60 seconds');
  processReminders(); // run once immediately on boot
  setInterval(processReminders, 60 * 1000);
}
