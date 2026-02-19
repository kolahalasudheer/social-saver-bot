# NITK Hackathon Project

Instagram Reel Analysis and Management System

## Project Structure

```
src/
├── config/          # Infrastructure configs (DB, Twilio, AI)
├── routes/          # Route definitions
├── controllers/     # Request handlers
├── services/        # Business logic layer
├── models/          # DB interaction layer
├── middleware/      # Express middlewares
├── utils/           # Helper functions
├── jobs/            # Background schedulers
└── validators/      # Validation schemas
```

## Setup

### Prerequisites
- Node.js 16+
- PostgreSQL
- Twilio Account
- Google Gemini API Key

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:
```
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hackathon_db

TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE=your_phone

GOOGLE_API_KEY=your_api_key

PORT=3000
```

## Running the Server

```bash
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Health
- `GET /api/health` - Health check

### Reels
- `GET /api/reels` - Get all reels
- `GET /api/reels/:id` - Get reel by ID
- `POST /api/reels` - Create new reel
- `PUT /api/reels/:id` - Update reel
- `DELETE /api/reels/:id` - Delete reel

### Webhooks
- `POST /api/webhook` - Handle incoming webhooks

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```

## Features

- Instagram reel analysis using Gemini AI
- SMS reminders via Twilio
- PostgreSQL database integration
- Structured JSON responses with confidence scores
- Intent detection and categorization

## License

MIT
