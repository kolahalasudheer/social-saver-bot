// AI service for Gemini integration (ESM)
import aiClient from '../config/ai.js';

class AIService {
  static async analyzeCaption(caption) {
    try {
      const model = aiClient.getGenerativeModel({ model: 'gemini-flash-latest' });

      const result = await model.generateContent(`
You are an AI that analyzes Instagram captions.
Return ONLY valid JSON.

Caption: ${caption}

Return JSON with:
- summary (string)
- categories (array of objects with label and confidence between 0 and 1)
- inferred_intent (string)
      `);

      const response = await result.response;
      const text = await response.text();

      return JSON.parse(text);
    } catch (error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  static async generateContent(prompt) {
    try {
      const model = aiClient.getGenerativeModel({ model: 'gemini-flash-latest' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return await response.text();
    } catch (error) {
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }
}

export { AIService };
