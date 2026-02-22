import asyncHandler from "../middleware/asyncHandler.js";
import { createReminder } from "../services/reel.repository.js";
import { parseReminderFromMessage, formatReminderTime } from "../utils/dateParser.js";

/**
 * Create a new reminder for a reel
 * POST /api/reels/:id/reminders
 */
export const addReminder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { remindAt, text, userPhone } = req.body;

    let finalRemindAt;
    let finalNote = null;

    if (remindAt) {
        // If sent from a datetime picker
        finalRemindAt = new Date(remindAt);
        if (isNaN(finalRemindAt.getTime())) {
            return res.status(400).json({ success: false, error: "Invalid date format" });
        }
    } else if (text) {
        // If sent as natural language text
        const parsed = parseReminderFromMessage(`remind me ${text}`);
        if (!parsed) {
            return res.status(400).json({ success: false, error: "Cloud not parse reminder time" });
        }
        finalRemindAt = parsed.remindAt;
        finalNote = parsed.note;
    } else {
        return res.status(400).json({ success: false, error: "Either remindAt or text is required" });
    }

    // Basic validation: must be in the future
    if (finalRemindAt <= new Date()) {
        return res.status(400).json({ success: false, error: "Reminder time must be in the future" });
    }

    const reminder = await createReminder({
        reelId: id,
        userPhone: userPhone, // Dashboard should probably send this or we get from session (but no auth yet)
        remindAt: finalRemindAt,
        note: finalNote
    });

    res.status(201).json({
        success: true,
        data: {
            id: reminder.id,
            remindAt: reminder.remind_at,
            formattedTime: formatReminderTime(reminder.remind_at)
        }
    });
});
