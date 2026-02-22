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

### Architecture Diagram

```mermaid
flowchart LR
    User(["👤 User on WhatsApp"]) -->|"Sends Message"| Twilio["Twilio API"]
    Twilio -->|"Webhook POST"| Express["⚙️ Express Server"]
    Express -->|"Reply"| Twilio
    Twilio -->|"Response"| User

    subgraph bg["Background Processing"]
        direction LR
        Apify["🔍 Apify Scraper"] -->|"extracted_metadata"| Gemini["🤖 Gemini AI"]
    end

    Express -->|"Scrape Request"| Apify
    Express -->|"AI Request"| Gemini
    Gemini -->|"Processed Result"| Express
    Express -->|"Store"| DB[("PostgreSQL")]
    DB -->|"Fetch"| Dashboard["📊 Web Dashboard"]
```

---

### Data Extraction & Processing Pipeline

```mermaid
flowchart TD
    A["INSTAGRAM REEL URL"] --> B["APIFY API PARSING"]

    B --> C1["Reel caption"]
    B --> C2["Reel hashtags"]
    B --> C3["Reel Thumbnail"]
    B --> C4["Reel URL"]
    B --> C5["Account Username"]

    C1 & C2 & C3 & C4 & C5 --> D["JSON Output\nreel_caption · reel_hashtags\nreel_thumbnail · reel_url · reel_accountname"]

    D --> G(["GEMINI API"])

    P1["Webhook receives URL"] --> P2["Validate URL"]
    P2 --> P3["Insert reel — status: processing"]
    P3 --> P4["Trigger metadata extraction — async"]
    P4 --> P5["Update reel with metadata"]
    P5 --> P6["Trigger AI summary"]
    P4 --> B
    P6 --> G
    G --> P7["Update reel — summary + category + intent"]
    P7 --> P8["status: completed ✅"]
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

## ⚙️ Setup

### Environment Variables (`.env`)
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
GEMINI_API_KEY=your_gemini_key
APIFY_API_TOKEN=your_apify_key
DASHBOARD_URL=http://localhost:3000
```

### Run Locally
```bash
npm install
npm run dev
```
> For WhatsApp webhook: expose port `3000` via **ngrok** and set the Twilio Sandbox webhook URL to `https://<ngrok-url>/api/webhook`.
