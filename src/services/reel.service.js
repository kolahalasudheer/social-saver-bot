// Reel business logic service (ESM)

import {
  createReelRecord,
  updateReelMetadata,
  updateReelAI,
  markReelFailed
} from "./reel.repository.js";

import { extractInstagramMetadata } from "./apify.service.js";
import { AIService } from "./ai.service.js";

export const saveReel = async (userPhone, url) => {
  let reelRecord;

  try {
    // 1️⃣ Extract shortcode
    const shortcode = extractShortcode(url);

    if (!shortcode) {
      throw new Error("Invalid Instagram URL format");
    }

    // 2️⃣ Insert initial record (processing)
    reelRecord = await createReelRecord({
      userPhone,
      originalUrl: url,
      shortcode
    });

    // 3️⃣ Extract metadata (Apify)
    const metadata = await extractInstagramMetadata(url);
    console.log("Metadata:", metadata);

    // 4️⃣ Update metadata
    await updateReelMetadata(shortcode, metadata);
    console.log("Metadata DB updated");

    // 5️⃣ Run AI enrichment
    console.log("Starting AI analysis...");
    const aiResult = await AIService.analyzeReel({
    caption: metadata.caption,
    hashtags: metadata.hashtags
});
    console.log("AI Result:", aiResult);

    // 6️⃣  Update AI fields
    const finalReel = await updateReelAI(shortcode, aiResult);
    console.log("AI DB updated");
    
    return finalReel;

  } catch (error) {

    // If something fails after insert → mark failed
    if (reelRecord?.shortcode) {
      await markReelFailed(reelRecord.shortcode);
    }

    throw error;
  }
};


// 🔎 Helper to extract shortcode
function extractShortcode(url) {
  const match = url.match(/\/(reel|p)\/([^/?]+)/);
  return match ? match[2] : null;
}