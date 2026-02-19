import dotenv from "dotenv";
dotenv.config();

import { extractInstagramMetadata } from "../services/apify.service.js";

const testUrl = "https://www.instagram.com/reel/DU69FglDMX5/";


(async () => {
  try {
    console.log("Testing Apify extraction...\n");

    const data = await extractInstagramMetadata(testUrl);

    console.log("✅ Extraction Successful:\n");
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Extraction Failed:");
    console.error(error.message);
  }
})();
