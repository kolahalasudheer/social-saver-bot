import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error("GOOGLE_API_KEY is not set. Add it to a .env file or your environment variables.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent(`
You are an AI that analyzes Instagram captions.

Return ONLY valid JSON.

Caption:
5 easy leg workouts you can do at home without equipment.

Return JSON with:
- summary (string)
- categories (array of objects with label and confidence between 0 and 1)
- inferred_intent (string)
`);

    const response = await result.response;
    const text = await response.text();

    console.log("Raw Response:");
    console.log(text);
    console.log("Response type:", typeof text, "length:", text ? text.length : 0);

    try {
      console.log("\n\nParsed JSON:");
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
    } catch (parseErr) {
      console.error('Failed to parse JSON from model response:', parseErr.message);
    }

  } catch (error) {
    console.error("Error:", error.message || error);
    process.exit(1);
  }
}

testModel();
