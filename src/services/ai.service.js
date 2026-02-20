// AI service for Gemini integration (ESM)
import aiClient from '../config/ai.js';

class AIService {

  static async analyzeReel({ caption, hashtags }) {
    try {
      const model = aiClient.getGenerativeModel({
        model: 'gemini-flash-latest'
      });

      const prompt = `
You are a strict Instagram reel analyzer.

CAPTION:
${caption}

HASHTAGS:
${JSON.stringify(hashtags)}

Return ONLY valid JSON.

Use this exact structure:

{
  "summary": "Max 2 concise sentences",
  "category": "One of: Education, Entertainment, Fitness, Tech, Motivation, Business, Lifestyle, Other",
  "intent": "One of: Educational, Promotional, Informational, Personal, Entertainment"
}

Do not include markdown formatting.
Do not include explanation.
Only return JSON.
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