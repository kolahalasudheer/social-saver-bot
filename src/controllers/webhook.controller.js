import asyncHandler from "../middleware/asyncHandler.js";
import { sendWhatsAppMessage } from "../services/twilio.service.js";
import { extractInstagramLink } from "../utils/linkParser.js";
import {
  findReelByUserAndShortcode,
  createReelRecord,
  updateReelMetadata,
  markReelFailed,
} from "../services/reel.repository.js";
import { extractInstagramMetadata } from "../services/apify.service.js";

export const handleWebhook = asyncHandler(async (req, res) => {
  const { From, Body } = req.body;

  if (!From || !Body) {
    return res.status(400).json({ error: "Invalid webhook payload" });
  }

  const userPhone = From.replace("whatsapp:", "");

  const link = extractInstagramLink(Body);

  if (!link) {
    await sendWhatsAppMessage({
      to: userPhone,
      body: "❌ Please send a valid Instagram link.",
    });
    return res.sendStatus(200);
  }

  // 🔎 Extract shortcode
  const match = link.match(/\/(reel|p)\/([^/?]+)/);
  if (!match) {
    await sendWhatsAppMessage({
      to: userPhone,
      body: "❌ Invalid Instagram reel format.",
    });
    return res.sendStatus(200);
  }

  const shortcode = match[2];

  // 🔎 Check if reel already exists for this user
  const existingReel = await findReelByUserAndShortcode(userPhone, shortcode);
  if (existingReel) {
    await sendWhatsAppMessage({
      to: userPhone,
      body: "📌 This reel is already saved in your dashboard!",
    });
    return res.sendStatus(200);
  }

  // 1️⃣ Create initial DB record (processing state)
  await createReelRecord({
    userPhone,
    originalUrl: link,
    shortcode,
  });

  // 2️⃣ Immediate response to user
  await sendWhatsAppMessage({
    to: userPhone,
    body: "✅ Reel is successfully saved in your dashboard 🚀",
  });

  // 3️⃣ Background processing (non-blocking)
  processReel(shortcode, link);

  res.sendStatus(200);
});


// 🔥 Background processor
async function processReel(shortcode, reelUrl) {
  try {
    const metadata = await extractInstagramMetadata(reelUrl);

    await updateReelMetadata(shortcode, metadata);

    console.log("Reel processing completed:", shortcode);
  } catch (error) {
    console.error("Reel processing failed:", error.message);
    await markReelFailed(shortcode);
  }
}
