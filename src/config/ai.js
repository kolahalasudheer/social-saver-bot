import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedClient = null;

export function getAIClient() {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables");
  }

  console.log("Gemini Key Loaded: YES");
  cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
}