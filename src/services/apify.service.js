import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

/* -------------------------
   CONFIG
------------------------- */

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR_ID = "apify~instagram-scraper";

if (!APIFY_TOKEN) {
  console.warn("⚠️  APIFY_API_TOKEN is missing. Add it to .env to use Apify extraction features");
}

/* -------------------------
   URL VALIDATION
------------------------- */

function validateReelUrl(url) {
  const pattern =
    /^https:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+/;
  return pattern.test(url);
}

/* -------------------------
   SHORTCODE EXTRACTION
------------------------- */

function extractShortcode(url) {
  const match = url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
  return match ? match[2] : null;
}

/* -------------------------
   CAPTION NORMALIZATION
------------------------- */

function normalizeCaption(text = "") {
  return text.trim().replace(/\s+/g, " ");
}

/* -------------------------
   HASHTAG EXTRACTION (Unicode Safe)
------------------------- */

function extractHashtags(text = "") {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  return [...new Set(matches)];
}

/* -------------------------
   MAIN EXTRACTION FUNCTION
------------------------- */

export async function extractInstagramMetadata(reelUrl) {
  if (!APIFY_TOKEN) {
    throw new Error("APIFY_API_TOKEN is not configured. Add it to your .env file to use Instagram extraction features");
  }

  try {
    if (!validateReelUrl(reelUrl)) {
      throw new Error("Invalid Instagram reel URL format");
    }

    const shortcode = extractShortcode(reelUrl);

    const response = await axios.post(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        directUrls: [reelUrl],
        resultsLimit: 1,
      }
    );

    const reelData = response.data[0];

    if (!reelData) {
      throw new Error("No reel data returned from Apify");
    }

    const normalizedCaption = normalizeCaption(reelData.caption || "");

    return {
      source: "apify",
      shortcode,
      url: reelData.url || reelUrl,
      caption: normalizedCaption,
      hashtags: extractHashtags(normalizedCaption),
      username: reelData.ownerUsername || null,
      full_name: reelData.ownerFullName || null,
      thumbnail_url: reelData.displayUrl || null,
      video_url: reelData.videoUrl || null,
      duration_seconds: reelData.videoDuration || null,
      timestamp: reelData.timestamp || null,
    };
  } catch (error) {
    console.error(
      "Apify extraction error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to extract Instagram metadata");
  }
}
