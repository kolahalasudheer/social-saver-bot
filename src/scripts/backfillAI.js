/**
 * backfillAI.js
 * 
 * Run this script ONCE to fill in summary / category / intent
 * for any reels that were scraped by Apify but never got AI analysis.
 *
 * Usage:  node src/scripts/backfillAI.js
 */

import dotenv from "dotenv";
dotenv.config();

import { getReelsNeedingAI, updateReelAI, markReelFailed } from "../services/reel.repository.js";
import { AIService } from "../services/ai.service.js";

async function run() {
    console.log("🔍 Fetching reels that need AI analysis...");

    const reels = await getReelsNeedingAI();

    if (reels.length === 0) {
        console.log("✅ No reels need AI backfill. All rows already have AI data.");
        process.exit(0);
    }

    console.log(`📋 Found ${reels.length} reel(s) to process.\n`);

    let success = 0;
    let failed = 0;

    for (const reel of reels) {
        const { shortcode, caption, hashtags } = reel;

        // hashtags may be stored as JSON string in DB — parse it
        let parsedHashtags = [];
        try {
            parsedHashtags = typeof hashtags === "string" ? JSON.parse(hashtags) : (hashtags || []);
        } catch {
            parsedHashtags = [];
        }

        console.log(`⚙️  Processing [${shortcode}] — caption: "${caption?.slice(0, 60)}..."`);

        try {
            const aiResult = await AIService.analyzeReel({
                caption,
                hashtags: parsedHashtags,
            });

            await updateReelAI(shortcode, aiResult);

            console.log(`   ✅ Done — category: ${aiResult.category} | intent: ${aiResult.intent}`);
            console.log(`   📝 Summary: ${aiResult.summary}\n`);
            success++;

        } catch (err) {
            console.error(`   ❌ Failed for [${shortcode}]:`, err.message);
            await markReelFailed(shortcode);
            failed++;
        }
    }

    console.log("─────────────────────────────────");
    console.log(`✅ Success: ${success}   ❌ Failed: ${failed}`);
    console.log("Backfill complete.");
    process.exit(0);
}

run().catch((err) => {
    console.error("💥 Backfill script crashed:", err);
    process.exit(1);
});
