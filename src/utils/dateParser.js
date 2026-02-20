/**
 * dateParser.js — Natural language reminder time parser
 * Extracts a Date from messages like:
 *   "remind me tomorrow at 6pm"
 *   "remind me in 2 hours"
 *   "remind me on friday at 9am"
 *   "set reminder at 8pm"
 */

/**
 * Returns { remindAt: Date, note: string|null } or null if no reminder found
 */
export function parseReminderFromMessage(message) {
  const text = message.toLowerCase().trim();

  // Must contain a reminder keyword
  const hasReminder = /remind|reminder|alert|notify|ping|set alarm/.test(text);
  if (!hasReminder) return null;

  const now = new Date();
  let remindAt = null;

  // ── "in X minutes/hours/days" ─────────────────────
  const relMatch = text.match(/in\s+(\d+)\s*(minute|min|hour|hr|day|week)s?/);
  if (relMatch) {
    const amount = parseInt(relMatch[1], 10);
    const unit = relMatch[2];
    remindAt = new Date(now);
    if (unit.startsWith('min')) remindAt.setMinutes(remindAt.getMinutes() + amount);
    if (unit.startsWith('hour') || unit === 'hr') remindAt.setHours(remindAt.getHours() + amount);
    if (unit.startsWith('day')) remindAt.setDate(remindAt.getDate() + amount);
    if (unit.startsWith('week')) remindAt.setDate(remindAt.getDate() + amount * 7);
  }

  // ── "tomorrow [at Xpm]" ───────────────────────────
  if (!remindAt && text.includes('tomorrow')) {
    remindAt = new Date(now);
    remindAt.setDate(remindAt.getDate() + 1);
    const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      remindAt = applyTime(remindAt, timeMatch);
    } else {
      remindAt.setHours(9, 0, 0, 0); // default 9am
    }
  }

  // ── "today at Xpm" ────────────────────────────────
  if (!remindAt && text.includes('today')) {
    remindAt = new Date(now);
    const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      remindAt = applyTime(remindAt, timeMatch);
    }
  }

  // ── Named day: "on friday [at Xpm]" ──────────────
  if (!remindAt) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayMatch = text.match(/(?:on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
    if (dayMatch) {
      const targetDay = days.indexOf(dayMatch[1]);
      remindAt = new Date(now);
      const diff = (targetDay - now.getDay() + 7) % 7 || 7; // at least 1 day ahead
      remindAt.setDate(remindAt.getDate() + diff);
      const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (timeMatch) {
        remindAt = applyTime(remindAt, timeMatch);
      } else {
        remindAt.setHours(9, 0, 0, 0);
      }
    }
  }

  // ── Bare time: "at 6pm" (today or tomorrow if past) ──
  if (!remindAt) {
    const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
      remindAt = applyTime(new Date(now), timeMatch);
      // If the time has already passed today, push to tomorrow
      if (remindAt <= now) remindAt.setDate(remindAt.getDate() + 1);
    }
  }

  if (!remindAt) return null;

  // Extract optional personal note (text after the time phrase, excluding link/shortcode)
  const noteMatch = message.match(/remind(?:er)?\s+me\s+.*?(?:at\s+[\d:apm]+|tomorrow|today|in\s+\d+\s*\w+|on\s+\w+day)?[—\-–]?\s*(.+)?$/i);
  let note = null;
  if (noteMatch && noteMatch[1]) {
    const cleaned = noteMatch[1].replace(/https?:\/\/\S+/g, '').trim();
    if (cleaned.length > 2) note = cleaned;
  }

  return { remindAt, note };
}

/** Applies parsed time components to a Date */
function applyTime(date, match) {
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/** Formats a Date into a human-readable string */
export function formatReminderTime(date) {
  return date.toLocaleString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}
