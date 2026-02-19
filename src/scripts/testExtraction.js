import dotenv from "dotenv";
dotenv.config();

import { extractReelMetadata } from "../services/reelExtraction.service.js";

const testUrl = "https://www.instagram.com/reel/XXXX/";


(async () => {
  try {
    const data = await extractReelMetadata(testUrl);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test failed:", error.message);
  }
})();
