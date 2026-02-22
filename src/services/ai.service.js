// AI service for Gemini integration (ESM)
import aiClient from '../config/ai.js';

class AIService {

  static async analyzeReel({ caption, hashtags, username, fullName, duration }) {
    try {
      const model = aiClient.getGenerativeModel({
        model: 'gemini-flash-latest'
      });

      const prompt = `
You are an expert social media and content analyst. Your job is to deeply understand an Instagram Reel based on its metadata.

CRITICAL INSTRUCTIONS:
1. You may receive reels with VERY short captions (1-2 words) or NO hashtags at all. Do not panic.
2. If the caption is extremely short or missing, rely heavily on the "Username" and "Full Name" to infer the type of content this creator likely publishes (e.g., a username like "tech_guru" implies Tech/Educational).
3. Even with minimal text, deduce the core message, vibe, or value proposition by profiling the creator and their niche.

CREATOR CONTEXT:
Username: @${username || "Unknown"}
Full Name: ${fullName || "Unknown"}

REEL DETAILS:
Duration: ${duration ? duration + " seconds" : "Unknown"}

CAPTION:
${caption || "No caption provided"}

HASHTAGS:
${hashtags && hashtags.length > 0 ? JSON.stringify(hashtags) : "None provided"}

Based on the context above, extract the following information and return it strictly as a JSON object:

{
  "summary": "Write a highly descriptive and engaging summary (max 2 sentences) that captures the true essence, value proposition, or main takeaway of the reel.",
  "category": "Choose the most accurate and specific fit. Examples: [Education, Comedy/Funny, Fitness, Tech, Motivation, Business, Lifestyle, Finance, Travel, Food, Fashion, Sports, Art/Design, Music, News, or provide a highly specific 1-2 word category]",
  "intent": "Determine the creator's primary goal. Choose from: [Educational, Promotional, Informational, Personal, Entertainment, Inspirational, Satirical/Parody]"
}

Return ONLY the raw JSON object. Do not include markdown formatting like \`\`\`json.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = await response.text();

      // 🔥 Clean markdown if Gemini wraps output
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(text);

      // 🔐 Validate structure
      if (!parsed.summary || !parsed.category || !parsed.intent) {
        throw new Error("Invalid AI response structure");
      }

      return {
        summary: parsed.summary,
        category: parsed.category,
        intent: parsed.intent
      };

    } catch (error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}

export { AIService };