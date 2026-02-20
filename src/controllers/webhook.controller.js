import asyncHandler from "../middleware/asyncHandler.js";
import { sendWhatsAppMessage } from "../services/twilio.service.js";
import { extractInstagramLink } from "../utils/linkParser.js";
import {
  findReelByUserAndShortcode,
  createReelRecord,
  updateReelMetadata,
  updateReelAI,
  markReelFailed,
  createReminder,
  getRecentReelsByUser,
} from "../services/reel.repository.js";
import { extractInstagramMetadata } from "../services/apify.service.js";
import { AIService } from "../services/ai.service.js";
import { parseReminderFromMessage, formatReminderTime } from "../utils/dateParser.js";

// ─── In-memory session store ───────────────────────────────────────────────
// Tracks per-user state so we can handle "1/2/3" replies and multi-step flows
// Structure: { [userPhone]: { reelId, shortcode, url, step: null | 'awaiting_time' } }
const sessions = new Map();

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3000";

const SMART_REPLY_MENU = () =>
  `🤔 *What would you like to do?*\n\nReply with a number:\n⏰ *1* — Set a reminder\n📋 *2* — My recent saves\n📊 *3* — Open dashboard`;

// ─── Main webhook handler ──────────────────────────────────────────────────
export const handleWebhook = asyncHandler(async (req, res) => {
  const { From, Body } = req.body;

  if (!From || !Body) {
    return res.status(400).json({ error: "Invalid webhook payload" });
  }

  const userPhone = From.replace("whatsapp:", "");
  const text = Body.trim();
  const session = sessions.get(userPhone);

  // ── STEP A: User is in 'awaiting_time' — they replied to the reminder prompt ──
  if (session?.step === "awaiting_time") {
    const parsed = parseReminderFromMessage(`remind me ${text}`);
    if (parsed) {
      try {
        await createReminder({
          reelId: session.reelId,
          userPhone,
          remindAt: parsed.remindAt,
          note: null,
        });
        const timeStr = formatReminderTime(parsed.remindAt);
        await sendWhatsAppMessage({
          to: userPhone,
          body: `✅ Done! I'll remind you about this reel on *${timeStr}* 🔔`,
        });
      } catch (err) {
        await sendWhatsAppMessage({
          to: userPhone,
          body: "❌ Couldn't parse that time. Try: *tomorrow at 6pm* or *in 2 hours*",
        });
        return res.sendStatus(200);
      }
      sessions.delete(userPhone);
      return res.sendStatus(200);
    } else {
      // Still don't understand — give hint
      await sendWhatsAppMessage({
        to: userPhone,
        body: "🤔 I didn't understand that time.\n\nTry something like:\n• *tomorrow at 6pm*\n• *in 2 hours*\n• *friday at 9am*",
      });
      return res.sendStatus(200);
    }
  }

  // ── STEP B: User replied with 1 / 2 / 3 (quick action) ───────────────────
  if (session && /^[123]$/.test(text)) {
    if (text === "1") {
      // Set reminder — ask for time
      sessions.set(userPhone, { ...session, step: "awaiting_time" });
      await sendWhatsAppMessage({
        to: userPhone,
        body: "⏰ When should I remind you?\n\nReply with a time like:\n• *tomorrow at 6pm*\n• *in 2 hours*\n• *friday at 9am*",
      });
    } else if (text === "2") {
      // Show recent saves
      const recents = await getRecentReelsByUser(userPhone, 3);
      if (recents.length === 0) {
        await sendWhatsAppMessage({
          to: userPhone,
          body: "📭 No reels saved yet! Send an Instagram reel link to get started.",
        });
      } else {
        const lines = recents.map((r, i) => {
          const cat = r.category ? `[${r.category}]` : "";
          const desc = r.summary || r.caption?.slice(0, 60) || "No description";
          return `${i + 1}. ${cat} ${desc.trim()}...`;
        });
        await sendWhatsAppMessage({
          to: userPhone,
          body: `📋 *Your last ${recents.length} saves:*\n\n${lines.join("\n\n")}\n\n📊 See all: ${DASHBOARD_URL}`,
        });
      }
      sessions.delete(userPhone);
    } else if (text === "3") {
      // Open dashboard
      await sendWhatsAppMessage({
        to: userPhone,
        body: `📊 Open your dashboard here:\n${DASHBOARD_URL}`,
      });
      sessions.delete(userPhone);
    }
    return res.sendStatus(200);
  }

  // ── STEP C: Normal flow — check for Instagram link ────────────────────────
  const link = extractInstagramLink(Body);

  if (!link) {
    const hint = session
      ? `Reply *1* for a reminder, *2* for recent saves, *3* for dashboard.\n\nOr send a new Instagram reel link to save it.`
      : `❌ Please send a valid Instagram reel link.\n\nYou can also reply:\n⏰ *1* — Reminder\n📋 *2* — Recent saves\n📊 *3* — Dashboard`;
    await sendWhatsAppMessage({ to: userPhone, body: hint });
    return res.sendStatus(200);
  }

  // Extract shortcode
  const match = link.match(/\/(reel|p)\/([^/?]+)/);
  if (!match) {
    await sendWhatsAppMessage({
      to: userPhone,
      body: "❌ Invalid Instagram reel format.",
    });
    return res.sendStatus(200);
  }

  const shortcode = match[2];

  // Duplicate check
  const existingReel = await findReelByUserAndShortcode(userPhone, shortcode);
  if (existingReel) {
    // Refresh session so they can still use quick replies on the existing reel
    sessions.set(userPhone, {
      reelId: existingReel.id,
      shortcode,
      url: existingReel.canonical_url || existingReel.url || link,
      step: null,
    });
    await sendWhatsAppMessage({
      to: userPhone,
      body: `📌 This reel is already in your dashboard!\n\n${SMART_REPLY_MENU()}`,
    });
    return res.sendStatus(200);
  }

  // 1️⃣ Create initial DB record (handling duplicates gracefully)
  let reelRecord;
  try {
    reelRecord = await createReelRecord({ userPhone, originalUrl: link, shortcode });
  } catch (err) {
    // Duplicate shortcode in DB (unique constraint)
    if (err.statusCode === 409 || err.code === '23505') {
      const existing = await findReelByUserAndShortcode(userPhone, shortcode) ||
        { id: null, canonical_url: link, url: link };
      sessions.set(userPhone, {
        reelId: existing.id,
        shortcode,
        url: existing.canonical_url || existing.url || link,
        step: null,
      });
      await sendWhatsAppMessage({
        to: userPhone,
        body: `📌 This reel is already in your dashboard!\n\n${SMART_REPLY_MENU()}`,
      });
      return res.sendStatus(200);
    }
    // Other unexpected errors — still reply to user
    console.error('[Webhook] createReelRecord failed:', err.message);
    await sendWhatsAppMessage({
      to: userPhone,
      body: '⚠️ Something went wrong while saving. Please try again.',
    });
    return res.sendStatus(200);
  }


  // 2️⃣ Store session for quick-reply follow-up
  sessions.set(userPhone, {
    reelId: reelRecord.id,
    shortcode,
    url: link,
    step: null,
  });

  // 3️⃣ Check if user also set a reminder inline ("remind me tomorrow at 6pm")
  const parsed = parseReminderFromMessage(Body);
  let savedMsg = "✅ *Reel saved to your dashboard!* 🚀";

  if (parsed && reelRecord) {
    try {
      await createReminder({
        reelId: reelRecord.id,
        userPhone,
        remindAt: parsed.remindAt,
        note: parsed.note,
      });
      const timeStr = formatReminderTime(parsed.remindAt);
      savedMsg += `\n⏰ Reminder set for *${timeStr}*`;
      console.log(`[Webhook] Reminder set for ${shortcode} at ${parsed.remindAt}`);
    } catch (err) {
      console.error("[Webhook] Failed to save reminder:", err.message);
    }
  }

  // 4️⃣ Send confirmation + smart reply menu
  const fullReply = `${savedMsg}\n\n${SMART_REPLY_MENU()}`;
  await sendWhatsAppMessage({ to: userPhone, body: fullReply });

  // 5️⃣ Background processing (non-blocking)
  processReel(shortcode, link);

  res.sendStatus(200);
});


// ─── Background processor ─────────────────────────────────────────────────
async function processReel(shortcode, reelUrl) {
  try {
    console.log("[processReel] Starting Apify extraction for:", shortcode);
    const metadata = await extractInstagramMetadata(reelUrl);

    await updateReelMetadata(shortcode, metadata);
    console.log("[processReel] Metadata saved for:", shortcode);

    console.log("[processReel] Starting Gemini AI analysis for:", shortcode);
    const aiResult = await AIService.analyzeReel({
      caption: metadata.caption,
      hashtags: metadata.hashtags,
    });

    await updateReelAI(shortcode, aiResult);
    console.log("[processReel] ✅ Pipeline complete for:", shortcode);

  } catch (error) {
    console.error("[processReel] ❌ Failed for:", shortcode, error.message);
    await markReelFailed(shortcode);
  }
}
