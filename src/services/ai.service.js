// AI service for Gemini integration (ESM)
import aiClient from '../config/ai.js';
import axios from 'axios';

class AIService {

  static async analyzeReel({ caption, hashtags, username, fullName, duration, thumbnailUrl, isPost }) {
    try {
      const model = aiClient.getGenerativeModel({
        model: 'gemini-flash-latest'
      });

      let imagePart = null;
      if (isPost && thumbnailUrl) {
        try {
          const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer' });
          const base64Image = Buffer.from(response.data).toString('base64');
          imagePart = {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg'
            }
          };
        } catch (imgErr) {
          console.warn("[AIService] Failed to fetch image for analysis, falling back to text-only:", imgErr.message);
        }
      }

      const prompt = `
You are an expert social media and content analyst. Your job is to deeply understand an Instagram ${isPost ? 'post' : 'Reel'} based on its metadata${isPost ? ' and visual content' : ''}.

CRITICAL INSTRUCTIONS:
1. You may receive content with VERY short captions (1-2 words) or NO hashtags at all.
${isPost ? '2. If provided, use the ATTACHED IMAGE to understand the visual context, subject matter, and quality.' : '2. Use the provided text (Caption, Hashtags, Username) to understand the core message.'}
3. Combine ${isPost ? 'visual information with ' : ''}text details (Caption, Hashtags, Username) to deduce the core message, category, and intent.
4. If text is minimal${isPost ? ' and it is a post' : ''}, let the ${isPost ? 'visual content' : 'creator niche'} guide your summary.

CREATOR CONTEXT:
Username: @${username || "Unknown"}
Full Name: ${fullName || "Unknown"}

SOURCE DETAILS:
Type: ${isPost ? 'Post' : 'Reel/Video'}
Duration: ${duration ? duration + " seconds" : "Unknown"}

CAPTION:
${caption || "No caption provided"}

HASHTAGS:
${hashtags && hashtags.length > 0 ? JSON.stringify(hashtags) : "None provided"}

Based on the context above, extract the following information and return it strictly as a JSON object:

{
  "summary": "Write a highly descriptive and engaging summary (max 2 sentences) that captures the true essence, value proposition, or main takeaway of the content.",
  "category": "Choose the most accurate and specific fit using COMMON real-world terms. Examples: [Jobs, Coding, Gym, Cooking, Gaming, Tech, Finance, Motivation, Business, Lifestyle, Travel, Food, Fashion, Entertainment, news, or provide a highly specific 1-2 word category]",
  "intent": "Determine the creator's primary goal. Choose from: [Educational, Promotional, Informational, Personal, Entertainment, Inspirational, Satirical/Parody]"
}

Return ONLY the raw JSON object. Do not include markdown formatting like \`\`\`json.
`;

      const contents = imagePart ? [prompt, imagePart] : [prompt];
      const result = await model.generateContent(contents);
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