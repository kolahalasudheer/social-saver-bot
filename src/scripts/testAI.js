import dotenv from "dotenv";
dotenv.config();

import { AIService } from "../services/ai.service.js";

(async () => {
  try {
    const result = await AIService.analyzeReel({
      caption: "If you’re serious about cracking coding interviews, then this roadmap is for you!! #dsa #coding #hiring",
      hashtags: ["#dsa", "#coding", "#hiring"]
    });

    console.log("AI RESULT:");
    console.log(result);

  } catch (err) {
    console.error(err.message);
  }
})();