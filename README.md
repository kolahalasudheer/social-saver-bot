# Social Saver 🎬 — Intelligent Instagram Knowledge Hub

**Social Saver** is a WhatsApp-integrated platform that transforms how users save and recall Instagram content. By uniting **Twilio**, **Apify**, **Gemini AI**, and **PostgreSQL**, it turns saved Reels into a searchable, AI-classified, and actionable private dashboard.

---

## 📌 Submission

| | |
|---|---|
| **GitHub** | [Insert GitHub Repository Link Here] |
| **Demo Video(with subtiles and watermark)** | https://drive.google.com/drive/folders/1FrqnepFq5g_aiSmIzmqSSTY_ZgBs247e?usp=sharing |
| **Demo Video(without subtiles and watermark)** | https://drive.google.com/drive/folders/1IAdbcwAEPZaKF3Gq-jXMh294hX6Dw0Vz?usp=sharing |

---

## 🏗️ System Architecture

<img width="1257" height="807" alt="Screenshot 2026-02-23 011038" src="https://github.com/user-attachments/assets/f0d8bb1b-8546-48df-9d02-427399edafb3" />

---

### Data Extraction & Processing Pipeline

<img width="1651" height="776" alt="Screenshot 2026-02-23 012017" src="https://github.com/user-attachments/assets/a119238f-70c7-4ee9-917a-08eb03098862" />

```
```
### WhatsApp → Database Connection

```mermaid
flowchart LR
    WA(["💬 WhatsApp\n(User)"])
    T["Twilio API"]
    E["⚙️ Express Server\n(Node.js)"]
    DB[("🗄️ PostgreSQL\n(Neon)")]

    WA -->|"Sends Instagram Link"| T
    T -->|"Webhook POST /api/webhook"| E
    E -->|"INSERT reel record"| DB
    DB -->|"Query user data"| E
    E -->|"Reply via WhatsApp"| T
    T -->|"Delivers response"| WA
```

---

## 📋 Evaluation Criteria

### ✅ Explainability
- **Summaries**: Gemini 1.5 Flash distills captions + hashtags into a focused 1-2 sentence takeaway.
- **Categories**: Assigns real-world labels (e.g., `Cooking`, `Fitness`, `Finance`) — not vague genre tags.
- **Intent**: Classifies the creator's goal — `Educational`, `Promotional`, `Inspirational`, etc.
- **Vision Support**: For static posts (`/p/`), the thumbnail is fetched and sent inline to Gemini as base64 image data, enabling multimodal classification even without captions.
- **Schema Enforcement**: AI response is validated against a strict JSON schema — malformed or vague outputs are rejected.

### ✅ System Architecture & Engineering
- **Async Pipeline**: Twilio gets an instant `200 OK`. Apify scraping + Gemini inference run asynchronously in the background.
- **Separation of Concerns**: Ingestion → Extraction → Classification → Persistence are fully independent layers.
- **Edge Case Handling**:
    - Duplicate links → detected and handled without re-processing.
    - Failed pipeline → user can re-send the link to retry.
    - Missing captions → fallback to username/hashtag analysis.
    - Twilio sandbox limit errors → caught gracefully without crashing.

### ✅ Usability & Presentation
- **Zero Passwords**: Dashboard login uses WhatsApp OTP — no accounts needed.
- **Omni-Channel**: Users can interact entirely from WhatsApp (save, remind, view recent), or use the rich web dashboard.
- **Low Friction**: First-time onboarding is one WhatsApp message. No app install required.

### ✅ Code Integrity
- All core logic (state machine, async pipeline, AI prompts, SQL schema, dashboard UI) was built from scratch during this hackathon.
- External services used (clearly attributed):
    - `@google/generative-ai` — LLM inference
    - `apify-client` / `axios` — Instagram metadata scraping
    - `twilio` — WhatsApp messaging
    - `pg` — PostgreSQL driver (Neon Serverless)
    - `express` — HTTP routing

---

## 📁 Project Structure

```
src/
├── server.js                 # Entry point, starts server + reminder cron job
├── app.js                    # Express setup, middleware, route binding
├── config/
│   ├── db.js                 # PostgreSQL connection pool
│   └── ai.js                 # Gemini AI client initialization
├── controllers/
│   ├── webhook.controller.js # Conversational state machine + pipeline orchestrator
│   ├── reel.controller.js    # Dashboard REST endpoints (list, delete, star)
│   └── auth.controller.js    # OTP generation and verification
├── services/
│   ├── apify.service.js      # Instagram metadata scraper (Apify)
│   ├── ai.service.js         # Gemini multimodal analysis
│   ├── twilio.service.js     # WhatsApp message dispatcher
│   ├── reel.repository.js    # Reel DB queries (CRUD + SQL)
│   └── user.repository.js    # User and Auth OTP DB queries
├── jobs/
│   └── reminder.job.js       # Cron job: checks & sends pending reminders
├── middleware/
│   ├── asyncHandler.js       # Promise rejection wrapper
│   └── error.middleware.js   # Global error handler
└── utils/
    ├── linkParser.js         # Extracts Instagram links from WhatsApp text
    └── dateParser.js         # NLP for reminder times ("tomorrow at 6pm")
client/                       # Vanilla JS/HTML/CSS dashboard frontend
```

---

# ⚙️ Setup

Follow these steps to run Social Saver locally.

---

## 1️⃣ Prerequisites

Ensure you have:

- Node.js (v18 or higher)
- PostgreSQL database (Neon recommended)
- Twilio account (WhatsApp Sandbox enabled)
- Apify account
- Google Gemini API key
- ngrok

---

## 2️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/social-saver.git
cd social-saver
```

---

## 3️⃣ Install Dependencies

```bash
npm install
```

---

## 4️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following variables:

```
DATABASE_URL=your_postgresql_connection_string

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

GEMINI_API_KEY=your_gemini_api_key
APIFY_API_TOKEN=your_apify_api_token

DASHBOARD_URL=http://localhost:3000
PORT=3000
```

⚠️ Never commit your `.env` file.

---

## 5️⃣ Set Up PostgreSQL Database

Create a database and run the required schema for:

- users
- reels
- otps

Ensure your `DATABASE_URL` matches your database.

---

## 6️⃣ Start the Server

```bash
npm run dev
```

You should see confirmation that:
- Server is running
- Database is connected

---

## 7️⃣ Expose Local Server to Twilio

Twilio cannot access `localhost`. Use ngrok:

```bash
ngrok http 3000
```

Copy the generated HTTPS URL.

---

## 8️⃣ Configure Twilio Webhook

In Twilio WhatsApp Sandbox settings:

Set webhook URL to:

```
https://your-ngrok-url/api/webhook
```

Method: `POST`

Save configuration.

---

## 9️⃣ Test the Application

1. Send an Instagram Reel link to your WhatsApp sandbox number.
2. The system will:
   - Extract metadata
   - Generate AI summary and category
   - Store data in database
3. Open your browser:

```
http://localhost:3000
```

Login via OTP and view saved reels.

---
- Confirm Apify token is valid.
- Ensure Instagram link is public.

---
> For WhatsApp webhook: expose port `3000` via **ngrok** and set the Twilio Sandbox webhook URL to `https://<ngrok-url>/api/webhook`.
