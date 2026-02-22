# Social Saver 🎬: Intelligent Instagram Knowledge Hub

Social Saver is a WhatsApp-integrated platform that transforms how users save, categorize, and recall valuable content from Instagram. By uniting Twilio, Apify, Gemini AI, and PostgreSQL, it turns a chaotic stream of saved Reels and Posts into a searchable, categorized, and actionable private dashboard. Built in 24 hours for the NITK Hackathon.

## 🌟 The Problem
Users save hundreds of Instagram Reels (recipes, tutorials, tech news, fitness tips) but quickly lose track of why they saved them. The native Instagram "Saved" tab is unsearchable and lacks context.

## 🛠️ The Solution
A seamless pipeline:
1. **Ingest**: User sends an IG Reel/Post link to our WhatsApp bot.
2. **Extract**: Apify scrapes the metadata (captions, tags) and media.
3. **Analyze**: Gemini AI multimodally analyzes the text (and images for posts) to generate an actionable summary, assign a real-world category, and determine the creator's intent.
4. **Organize & Recall**: Data is stored securely in PostgreSQL. Users can access a personalized web dashboard to search, filter, and delete content, or set SMS reminders via the bot.

---

## 🎯 Evaluation Criteria Alignment

### 1. Explainability & AI Reasoning
All classifications are explicitly generated and visibly presented:
- **Summaries**: Gemini 1.5 Flash distills lengthy captions (or visual payloads) into a 1-2 sentence core takeaway (e.g., "A 10-minute high-protein breakfast recipe").
- **Categorization**: Bypasses generic tags for real-world utilities (e.g., `Jobs`, `Coding`, `Cooking`, `Gym`).
- **Intent Detection**: The AI assesses the creator's goal (`Educational`, `Promotional`, `Motivational`), giving users immediate context on the *why* before they re-watch.
- **Evidence-Backed**: For static posts (`/p/`), the system uses Gemini's Vision capabilities to extract context directly from the image when captions are sparse.

### 2. System Architecture & Engineering
Built with a modular, scalable Node.js/Express architecture:
- **Separation of Concerns**:
  - `webhook.controller.js`: Ingestion and conversational state machine.
  - `apify.service.js`: Third-party scraping layer.
  - `ai.service.js`: LLM prompt engineering and vision integration.
  - `reel.repository.js`: Abstracted PostgreSQL interactions.
  - `client/`: Vanilla JS/CSS presentation layer with API-agnostic design.
- **Robustness**: 
  - Implements a Twilio "Demo Recovery Mode" (gracefully catches and logs 63038 sandbox limits without crashing the processing pipeline).
  - Handles missing Apify metadata and provides fallback AI reasoning.
- **Data Isolation**: Multi-user tenancy is strictly enforced at the SQL layer. Users authenticate via a WhatsApp OTP flow, ensuring they only retrieve their own `user_phone` records.

### 3. Usability & Presentation
The frontend (`index.html`, `styles.css`) is designed for immediate utility:
- **Zero-Friction Onboarding**: No passwords. Users authenticate securely via their WhatsApp number (OTP).
- **Visual Hierarchy**: The dashboard highlights intent badges, AI summaries, and real-world categories first, minimizing cognitive load.
- **Omni-Channel**: Users can manage saves directly within WhatsApp via interactive menus (1 for Reminders, 2 for Recent Saves) or use the rich web dashboard.

### 4. Code Integrity
- **100% Original Logic**: The core scraping orchestration, database schema, AI prompt engineering, state-machine webhook handling, and vanilla CSS/JS frontend were built from scratch for this event.
- **External Services Used**: Twilio (Messaging), Apify (IG Scraping), Google Gemini (LLM/Vision), Neon (Serverless Postgres).

---

## ⚙️ Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon Serverless)
- **AI/ML**: Google Gemini 1.5 Flash (Multimodal: Text + Vision)
- **APIs**: Twilio API (WhatsApp/OTP), Apify (Scraping)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL Database URL
- Twilio Account (Sandbox setup required)
- Google Gemini API Key
- Apify API Token

### Environment Variables (.env)
\`\`\`env
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# AI & Scraping
GEMINI_API_KEY=your_gemini_key
APIFY_API_TOKEN=your_apify_key

# Frontend
DASHBOARD_URL=http://localhost:3000
\`\`\`

### Running Locally
\`\`\`bash
1. npm install
2. npm start
\`\`\`
*(For WhatsApp integration, expose port 3000 via ngrok and configure your Twilio Sandbox webhook).*
