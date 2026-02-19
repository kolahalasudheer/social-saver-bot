import dotenv from "dotenv";
dotenv.config();

import { processReelExtraction } from "../services/reelExtraction.service.js";

const testUrl = "https://www.instagram.com/reel/DU69FglDMX5/";


(async () => {
  const result = await processReelExtraction(testUrl);
  console.log(JSON.stringify(result, null, 2));
})();
