import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing in environment variables");
}

console.log("Gemini Key Loaded:", apiKey ? "YES" : "NO");

const aiClient = new GoogleGenerativeAI(apiKey);

export default aiClient;