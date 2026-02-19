import { extractInstagramMetadata } from "./apify.service.js";

/* -------------------------
   BUSINESS VALIDATION
------------------------- */
function validateBusinessRules(metadata) {
  if (!metadata.caption || metadata.caption.length < 5) {
    throw new Error("Caption is too short or missing");
  }

  if (!metadata.username) {
    throw new Error("Instagram username missing");
  }

  return true;
}

/* -------------------------
   MAIN BUSINESS FUNCTION
------------------------- */
export async function processReelExtraction(reelUrl) {
  try {
    const metadata = await extractInstagramMetadata(reelUrl);

    // Additional sanity validation
    validateBusinessRules({
      caption: metadata.caption,
      username: metadata.username,
    });

    return {
      status: "completed",
      metadata,
    };

  } catch (error) {
    console.error("Reel extraction business error:", error.message);

    return {
      status: "failed",
      error: error.message,
    };
  }
}
