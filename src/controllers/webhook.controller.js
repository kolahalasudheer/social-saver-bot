import asyncHandler from "../middleware/asyncHandler.js";
import { sendWhatsAppMessage } from "../services/twilio.service.js";
import { extractInstagramLink } from "../utils/linkParser.js";
import {
  findReelByUserAndShortcode,
  createReelRecord,
  updateReelMetadata,
  updateReelAI,
  markReelFailed,
  resetReelToProcessing,
  createReminder,
  getRecentReelsByUser,
} from "../services/reel.repository.js";
import { extractInstagramMetadata } from "../services/apify.service.js";
import { AIService } from "../services/ai.service.js";
import { parseReminderFromMessage, formatReminderTime } from "../utils/dateParser.js";
import { findUserByPhone, createUser, markUserRegistered } from "../services/user.repository.js";

// ─── In-memory session store ───────────────────────────────────────────────
// Tracks per-user state so we can handle "1/2/3" replies and multi-step flows
// Structure: { [userPhone]: { reelId, shortcode, url, step: null | 'awaiting_time' } }
const sessions = new Map();

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3000";

const SMART_REPLY_MENU = () =>
  `🎬 *Reel Options*\n\nChoose an action below:`;

const BUTTONS = {
  REMINDER: "⏰ Set Reminder",
  RECENT: "📋 Recent Saves",
  DASHBOARD: "📊 Dashboard"
};

// ─── Main webhook handler ──────────────────────────────────────────────────
export const handleWebhook = asyncHandler(async (req, res) => {
  const { From, Body } = req.body;

  if (!From || !Body) {
    return res.status(400).json({ error: "Invalid webhook payload" });
  }

  const userPhone = From.replace("whatsapp:", "");
  const text = Body.trim();
  const session = sessions.get(userPhone);

  // ── STEP 0: Gatekeeper Onboarding ───────────────────────────────────────
  const user = await findUserByPhone(userPhone);
  const isRegistered = user?.is_registered;

  // Only trigger the onboarding question for COMPLETELY NEW users (not in DB)
  // or if they explicitly send the "join" message
  if (!user || text.toLowerCase().includes("join just-cat")) {

    // 1. Handle Explicit Join for ALREADY registered users
    if (isRegistered && text.toLowerCase().includes("join just-cat")) {
      await sendWhatsAppMessage({
        to: userPhone,
        body: `Welcome back to *Social Saver*! 🚀\n\n${SMART_REPLY_MENU()}\n1. ${BUTTONS.REMINDER}\n2. ${BUTTONS.RECENT}\n3. ${BUTTONS.DASHBOARD}`,
        contentSid: process.env.TWILIO_CONTENT_SID_MENU,
        contentVariables: { "1": BUTTONS.REMINDER, "2": BUTTONS.RECENT, "3": BUTTONS.DASHBOARD }
      });
      return res.sendStatus(200);
    }

    // 2. Handle reply to onboarding question (1 or 2)
    if (session?.step === "awaiting_registration") {
      if (text === "1") {
        // Option 1: Existing User
        if (user) {
          await markUserRegistered(userPhone);
          await sendWhatsAppMessage({ to: userPhone, body: "Welcome back again! 🚀\n\nSend a reel link to save it or use the menu below." });
          const pending = session.pendingBody;
          sessions.delete(userPhone);
          if (pending && extractInstagramLink(pending)) return handleWebhook(req, res);
          return res.sendStatus(200);
        } else {
          await sendWhatsAppMessage({ to: userPhone, body: "❌ You are not a user of this bot yet.\n\nReply *2* to create your dashboard." });
          return res.sendStatus(200);
        }
      } else if (text === "2") {
        // Option 2: New User
        if (isRegistered) {
          await sendWhatsAppMessage({ to: userPhone, body: "⚠️ You are already an existing user of this bot.\n\nReply *1* to continue." });
          return res.sendStatus(200);
        } else {
          await createUser(userPhone, true);
          await sendWhatsAppMessage({ to: userPhone, body: "✅ Welcome! Creating your personal dashboard now...\n\nJust send any Instagram reel link to get started! 🎬" });
          const pending = session.pendingBody;
          sessions.delete(userPhone);
          if (pending && extractInstagramLink(pending)) return handleWebhook(req, res);
          return res.sendStatus(200);
        }
      }
    }

    // 3. Send onboarding question ONLY if they are NOT in our DB at all
    if (!user) {
      sessions.set(userPhone, { step: "awaiting_registration", pendingBody: Body });
      await sendWhatsAppMessage({
        to: userPhone,
        body: "👋 *Welcome to Social Saver Bot!*\n\nAre you an existing user or a new user?\n\n1️⃣ — *Existing User*\n2️⃣ — *New User*"
      });
      return res.sendStatus(200);
    }
  }

  // ── STEP 0.5: Silent Registration for existing DB users ────────────────
  // If they exist in DB but aren't 'registered', mark them now without asking
  if (user && !isRegistered) {
    await markUserRegistered(userPhone);
  }

  // ── STEP A: User is in 'awaiting_time' ...
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

  // ── STEP B: User replied with 1 / 2 / 3 OR Buttons ───────────────────
  const isReminder = text === "1" || text.includes(BUTTONS.REMINDER);
  const isRecent = text === "2" || text.includes(BUTTONS.RECENT);
  const isDashboard = text === "3" || text.includes(BUTTONS.DASHBOARD);

  if (session && (isReminder || isRecent || isDashboard)) {
    if (isReminder) {
      // Set reminder — ask for time
      sessions.set(userPhone, { ...session, step: "awaiting_time" });
      await sendWhatsAppMessage({
        to: userPhone,
        body: "⏰ *When should I remind you?*\n\nReply with a time like:\n• *tomorrow at 6pm*\n• *in 2 hours*\n• *friday at 9am*",
      });
    } else if (isRecent) {
      // Show recent saves
      const recents = await getRecentReelsByUser(userPhone, 3);
      if (recents.length === 0) {
        await sendWhatsAppMessage({
          to: userPhone,
          body: "📭 *No reels saved yet!*\n\nSend an Instagram reel link to get started.",
        });
      } else {
        const lines = recents.map((r, i) => {
          const cat = r.category ? `[${r.category}]` : "";
          const desc = r.summary || r.caption?.slice(0, 60) || "No description";
          return `${i + 1}. ${cat} ${desc.trim()}...`;
        });
        await sendWhatsAppMessage({
          to: userPhone,
          body: `📋 *Your last ${recents.length} saves:*\n\n${lines.join("\n\n")}\n\n📊 *See all:* ${DASHBOARD_URL}`,
        });
      }
      sessions.delete(userPhone);
    } else if (isDashboard) {
      // Open dashboard
      await sendWhatsAppMessage({
        to: userPhone,
        body: `📊 *Open your dashboard here:*\n${DASHBOARD_URL}`,
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
    if (existingReel.status === 'failed') {
      // 🔄 Retrying a failed reel
      await resetReelToProcessing(shortcode);

      sessions.set(userPhone, {
        reelId: existingReel.id,
        shortcode,
        url: existingReel.canonical_url || existingReel.url || link,
        step: null,
      });

      await sendWhatsAppMessage({
        to: userPhone,
        body: `🔄 *Retrying the analysis for your reel...*\n\nPlease wait a moment.`,
      });

      // Restart pipeline
      processReel(shortcode, link, userPhone);
      return res.sendStatus(200);

    } else if (existingReel.status === 'processing') {
      // ⏳ Already processing
      await sendWhatsAppMessage({
        to: userPhone,
        body: `⏳ *This reel is currently being analyzed!*\n\nPlease wait a moment for the results.`,
      });
      return res.sendStatus(200);

    } else {
      // ✅ Completed or metadata_extracted
      sessions.set(userPhone, {
        reelId: existingReel.id,
        shortcode,
        url: existingReel.canonical_url || existingReel.url || link,
        step: null,
      });
      await sendWhatsAppMessage({
        to: userPhone,
        body: `✅ *Reel received and saved in your dashboard!* 🚀\n\n${SMART_REPLY_MENU()}\n1. ${BUTTONS.REMINDER}\n2. ${BUTTONS.RECENT}\n3. ${BUTTONS.DASHBOARD}`,
        contentSid: process.env.TWILIO_CONTENT_SID_MENU,
        contentVariables: { "1": BUTTONS.REMINDER, "2": BUTTONS.RECENT, "3": BUTTONS.DASHBOARD }
      });
      return res.sendStatus(200);
    }
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

      if (existing.status === 'failed') {
        await resetReelToProcessing(shortcode);
        sessions.set(userPhone, {
          reelId: existing.id,
          shortcode,
          url: existing.canonical_url || existing.url || link,
          step: null,
        });
        await sendWhatsAppMessage({
          to: userPhone,
          body: `🔄 *Retrying the analysis for your reel...*\n\nPlease wait a moment.`,
        });
        processReel(shortcode, link, userPhone);
        return res.sendStatus(200);
      } else if (existing.status === 'processing') {
        await sendWhatsAppMessage({
          to: userPhone,
          body: `⏳ *This reel is currently being analyzed!*\n\nPlease wait a moment for the results.`,
        });
        return res.sendStatus(200);
      } else {
        sessions.set(userPhone, {
          reelId: existing.id,
          shortcode,
          url: existing.canonical_url || existing.url || link,
          step: null,
        });
        await sendWhatsAppMessage({
          to: userPhone,
          body: `✅ *Reel received and saved in your dashboard!* 🚀\n\n${SMART_REPLY_MENU()}\n1. ${BUTTONS.REMINDER}\n2. ${BUTTONS.RECENT}\n3. ${BUTTONS.DASHBOARD}`,
          contentSid: process.env.TWILIO_CONTENT_SID_MENU,
          contentVariables: { "1": BUTTONS.REMINDER, "2": BUTTONS.RECENT, "3": BUTTONS.DASHBOARD }
        });
        return res.sendStatus(200);
      }
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

  // 4️⃣ Send simplified confirmation + menu
  await sendWhatsAppMessage({
    to: userPhone,
    body: `✅ *Reel received and saved in your dashboard!* 🚀\n\n${SMART_REPLY_MENU()}\n1. ${BUTTONS.REMINDER}\n2. ${BUTTONS.RECENT}\n3. ${BUTTONS.DASHBOARD}`,
    contentSid: process.env.TWILIO_CONTENT_SID_MENU,
    contentVariables: { "1": BUTTONS.REMINDER, "2": BUTTONS.RECENT, "3": BUTTONS.DASHBOARD }
  });

  // 5️⃣ Background processing (non-blocking)
  processReel(shortcode, link, userPhone);

  res.sendStatus(200);
});


// ─── Background processor ─────────────────────────────────────────────────
async function processReel(shortcode, reelUrl, userPhone) {
  try {
    console.log("[processReel] Starting Apify extraction for:", shortcode);
    const metadata = await extractInstagramMetadata(reelUrl);

    await updateReelMetadata(shortcode, metadata);
    console.log("[processReel] Metadata saved for:", shortcode);

    console.log("[processReel] Starting Gemini AI analysis for:", shortcode);
    const aiResult = await AIService.analyzeReel({
      caption: metadata.caption,
      hashtags: metadata.hashtags,
      username: metadata.username,
      fullName: metadata.full_name,
      duration: metadata.duration_seconds,
      thumbnailUrl: metadata.thumbnail_url,
      isPost: metadata.isPost
    });

    await updateReelAI(shortcode, aiResult);
    console.log("[processReel] ✅ Pipeline complete for:", shortcode);
  } catch (error) {
    console.error("[processReel] ❌ Failed for:", shortcode, error.message);
    await markReelFailed(shortcode);

    if (userPhone) {
      await sendWhatsAppMessage({
        to: userPhone,
        body: `⚠️ *Processing Failed*\n\nSomething went wrong while analyzing your reel. Please re-send the link to try again. 🔄`
      });
    }
  }
}
