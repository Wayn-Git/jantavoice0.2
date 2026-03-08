<div align="center">

# 🇮🇳 JantaVoice v3

### India's AI-Powered Civic Complaint Platform

*File complaints with your voice. Let AI call government officials. Track every issue to resolution.*

[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20MongoDB-blue?style=flat-square)](/)
[![AI](https://img.shields.io/badge/AI-Groq%20Llama3-purple?style=flat-square)](/)
[![Calls](https://img.shields.io/badge/Calls-Twilio%20%2B%20ElevenLabs-red?style=flat-square)](/)
[![AQI](https://img.shields.io/badge/AQI-OpenWeatherMap-green?style=flat-square)](/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Feature Details](#feature-details)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)

---

## Overview

JantaVoice is a full-stack civic engagement platform built for Indian citizens. It lets anyone file a government complaint in seconds using their voice, then uses AI to automatically format the complaint, detect the right department, escalate if unresolved, and even place real phone calls to government officials on your behalf.

**The platform works fully in demo mode** — all AI features run without any paid API keys. Add real keys to enable live AQI data, real phone calls, and voice transcription.

---

## Features

### 🎤 Voice & Complaint Filing

| Feature | Description |
|---|---|
| **Voice Complaint** | Speak your complaint — auto-transcribed with 3-second silence detection. Supports Hindi & English. |
| **Quick File (AI)** | Type a brief description, AI expands it into a formal complaint with department, priority, and category. |
| **Detailed 3-Step Form** | Step-by-step form with location, photos, and issue type. |
| **AI Complaint Formatting** | Groq Llama3 extracts department, priority, and a formal summary from raw input. |
| **PDF Letter Generator** | Auto-generates official complaint letters with tricolor header using PDFKit. |
| **Fake Complaint Detection** | Blocks spam: rate-limits 10 complaints/day per user, AI scores intent (0–1), hard-rejects score > 0.9. |

### 📞 AI Officer Calling System

| Feature | Description |
|---|---|
| **Call Permission Modal** | Shows generated script before dialing — user approves before any call is placed. |
| **AI Script Generation** | Groq generates a contextual phone script based on the complaint's category, location, and priority. |
| **Real Phone Calls** | Twilio places actual calls to government department numbers. |
| **ElevenLabs Voice** | Multilingual TTS (Eleven Multilingual v2) for natural-sounding AI speech. Falls back to Twilio Polly.Aditi. |
| **Live AI Conversation** | AI responds dynamically to officer replies using Groq — guides the call through intro → confirm → status → close. |
| **Call Transcription** | Deepgram Nova-2 transcribes recordings with speaker diarization (AI vs Officer labeled). |
| **AI Call Summary** | Groq generates a 3-bullet summary: resolution status, promised timeline, next steps. |
| **Auto Status Update** | Complaint status updates automatically based on officer's spoken response. |
| **ngrok Tunneling** | Auto-starts on server launch so Twilio webhooks work from any machine without manual configuration. |
| **Demo Mode** | Full call flow (script, modal, transcript) works without Twilio credentials. |

### 🏛️ Government Portal Integration

| Feature | Description |
|---|---|
| **Auto Gov Portal Filing** | Submits complaints to state-specific government portals (CPGRAMS, PGPortal, etc.) automatically. |
| **10-Minute Status Checker** | Cron job polls portal status every 10 minutes and updates complaint record. |
| **Smart Escalation Engine** | Day 3 → reminder, Day 5 → higher authority, Day 7 → state portal escalation. |
| **Manual Tracking** | Users can add a manual portal reference number to track via `track-manual`. |
| **Status History** | Every status change is timestamped and stored (who changed it, when, automated or manual). |

### 🌬️ AQI Monitor

| Feature | Description |
|---|---|
| **Dedicated AQI Page** | Full-page dashboard at `/aqi-monitor` with India map, search, forecasts, and health advice. |
| **Interactive India Map** | SVG map with 25 state paths + 12 city dots colored by live AQI. Animated pulse on selected city. |
| **City Search** | Search any Indian city by name — geocoded and fetched from OpenWeatherMap. |
| **My Location** | Browser geolocation auto-loads your area's AQI on page load. |
| **Animated AQI Gauge** | Circular SVG gauge with color-coded arc and glow effect. |
| **Pollutant Breakdown** | PM2.5, PM10, NO₂, O₃, CO, SO₂ with percentage bars and health descriptions. |
| **5-Day Forecast** | Daily AQI forecast using OpenWeatherMap's hourly forecast API (midday reading per day). |
| **Health Advice Tabs** | Per-group advice for Children, Elderly, Active Adults, Respiratory conditions, Pregnant women. |
| **City Rankings** | 12 major cities sorted by pollution level. Clickable to load city data. |
| **AQI Widget** | Floating bottom-left pill on all pages showing current location AQI. Links to full monitor page. |
| **Report Button** | If AQI > 150, shows a direct link to file a pollution complaint. |
| **Demo Mode** | Works with realistic hardcoded values for all 12 cities without any API key. |

### 🤖 Automation Engine

| Feature | Description |
|---|---|
| **6 Default Rules** | Auto-escalate after 3 days, auto-notify on status change, auto-close resolved, auto-assign department, etc. |
| **Toggle Rules** | Admin can enable/disable individual automation rules. |
| **Manual Trigger** | Admin can run the automation engine on-demand. |
| **Automation Logs** | Every automated action is logged with timestamp and complaint reference. |
| **30-Minute Cron** | Engine runs automatically every 30 minutes in the background. |

### 💬 AI Chatbot

| Feature | Description |
|---|---|
| **Floating Chatbot** | 🤖 FAB button opens a 370×520px glass-morphism chat window on all pages. |
| **Intent Detection** | Recognizes intents: open_report, open_tracker, open_letters, open_gov, and navigates accordingly. |
| **Groq Replies** | All chat responses powered by Groq Llama3 with civic-assistant persona. |
| **Quick Replies** | One-tap shortcuts for common actions. |
| **Typing Indicator** | Animated dots while AI generates response. |

### 🛡️ Privacy & Security

| Feature | Description |
|---|---|
| **Privacy-First** | No Aadhaar, no government IDs collected. Only name, phone, email required. |
| **Minimal Data Storage** | Raw voice input not stored long-term. Only structured complaint data retained. |
| **Rate Limiting** | Express rate limiter on all API routes. |
| **JWT Authentication** | 7-day expiry tokens, stored in localStorage. |
| **Login History** | Tracks last login times. Suspicious logins flagged. |
| **Complaint Verification** | Optional verification flag for complaints before escalation. |

### 📊 Dashboards

| Feature | Description |
|---|---|
| **User Dashboard** | My Complaints page with status timeline, call logs, gov ticket status. |
| **Admin Dashboard** | Full complaint management + 3 new tabs: Automation, Gov Tickets, Call Logs. |
| **Real-Time Notifications** | Bell icon with unread count. In-app notifications for all key events. |
| **Stats Counter** | Animated count-up for complaints filed, resolved, departments notified. |

---

## Tech Stack

### Backend
- **Node.js + Express** — REST API
- **MongoDB + Mongoose** — Database with 7 models
- **Groq SDK (Llama3-8b-8192)** — AI complaint analysis, fake detection, call scripts, chatbot
- **Twilio** — Real phone calls with TwiML webhooks
- **ElevenLabs** — Neural text-to-speech (Eleven Multilingual v2)
- **Deepgram Nova-2** — Call transcription with speaker diarization
- **ngrok** — Auto-tunnel for Twilio webhooks (Asia-Pacific region)
- **PDFKit** — PDF letter generation with tricolor header
- **node-cron** — Background jobs (escalation, gov portal, automation)
- **OpenWeatherMap API** — Air Pollution + Geocoding + Forecast APIs

### Frontend
- **React + Vite** — Fast SPA
- **React Router v6** — Client-side routing
- **Axios** — API client with JWT interceptor
- **Framer Motion** — Animations
- **react-hot-toast** — Notifications
- **Google Fonts** — Nunito + Rajdhani

---

## Project Structure

```
janta-voice/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── complaintController.js    # quickFile, aiCategorize, generateComplaintLetter
│   │   ├── govPortalController.js    # submitToPortal, checkStatus, startGovCheckCron
│   │   ├── automationController.js   # 6 default rules, runEngineOnce, startAutomationEngine
│   │   ├── callController.js         # Full calling flow (8 functions)
│   │   ├── chatbotController.js      # Intent detection + Groq replies
│   │   └── aqiController.js          # getAQI, getAQIByCity, getMajorCities, getForecast
│   ├── models/
│   │   ├── User.js                   # With loginHistory[], warnings, isSuspended
│   │   ├── Complaint.js              # With aiFormatted{}, statusHistory[], fakeScore, callLogId
│   │   ├── CallLog.js                # Full call state with conversationLog[], transcript
│   │   ├── GovTicket.js              # Portal submission + status tracking
│   │   ├── AutomationRule.js
│   │   ├── AutomationLog.js
│   │   └── Notification.js
│   ├── services/
│   │   ├── groqService.js            # analyzeComplaint, detectFake, generateLetter, callScript, chatbotReply
│   │   ├── twilioService.js          # placeCall, getCall, isTwilioConfigured
│   │   ├── elevenLabsService.js      # textToSpeech, generateCallAudio (6 scripts)
│   │   ├── deepgramService.js        # transcribeAudio with diarization
│   │   ├── ngrokService.js           # startNgrok, getUrl (Asia-Pacific region)
│   │   └── escalationService.js      # startEscalationChecker
│   ├── middleware/
│   │   ├── auth.js
│   │   └── fakeDetector.js           # Rate limit + AI fake scoring
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── govPortalRoutes.js
│   │   ├── automationRoutes.js
│   │   ├── callRoutes.js             # Twilio webhooks + user routes
│   │   ├── chatbotRoutes.js
│   │   └── aqiRoutes.js
│   ├── jobs/
│   │   └── statusChecker.js
│   ├── utils/
│   │   └── apiKeyChecker.js
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── ReportPage.jsx         # 3 tabs: Voice, Quick File, Detailed
    │   │   ├── AQIMonitorPage.jsx     # Full AQI dashboard with India map
    │   │   ├── GovTrackerPage.jsx
    │   │   ├── MyComplaintsPage.jsx
    │   │   ├── AdminPage.jsx          # + Automation, Gov Tickets, Call Logs tabs
    │   │   ├── LoginPage.jsx
    │   │   └── RegisterPage.jsx
    │   ├── components/
    │   │   ├── AnimatedBackground.jsx # Canvas: 3 Ashoka Chakras, 6 orbs, 22 particles
    │   │   ├── ChatBot.jsx            # Floating AI chatbot
    │   │   ├── AQIWidget.jsx          # Fixed bottom-left AQI pill
    │   │   ├── CallPermissionModal.jsx # 4-step calling flow
    │   │   └── CallTranscriptViewer.jsx # Polls call status, shows AI summary
    │   │   ├── hooks/
    │   │   │   ├── useVoice.js            # Web Speech API with silence detection
    │   │   │   └── useCountUp.js
    │   │   └── services/
    │   │       └── api.js                 # All API exports: auth, complaint, aqi, gov, automation, call, chatbot
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Clone and install

```bash
git clone <your-repo>
cd janta-voice

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values (see Environment Variables below)
```

### 3. Start

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Backend starts at `http://localhost:5000`
Frontend starts at `http://localhost:5173`

---

## Environment Variables

Create `backend/.env`:

```env
# ── Core ──────────────────────────────────────
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jantavoice
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ── AI (Required) ─────────────────────────────
GROQ_API_KEY=gsk_...                    # groq.com — free

# ── Tunneling (Required for calling) ──────────
NGROK_AUTH_TOKEN=...                    # dashboard.ngrok.com — free

# ── Calling (Optional — demo mode works without) ──
TWILIO_ACCOUNT_SID=AC...               # twilio.com/try-twilio — $15 free credit
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TEST_OFFICER_PHONE=+91XXXXXXXXXX       # Your number for test calls

# ── Voice (Optional) ──────────────────────────
ELEVENLABS_API_KEY=...                 # elevenlabs.io — 10k chars/month free
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# ── Transcription (Optional) ──────────────────
DEEPGRAM_API_KEY=...                   # console.deepgram.com — $200 free credit

# ── AQI (Optional — demo mode works without) ──
OPENWEATHER_API_KEY=...               # openweathermap.org/api — free tier

# ── Feature Flags ─────────────────────────────
AUTO_CHECK_ENABLED=true
FAKE_DETECTION_ENABLED=true
ESCALATION_ENABLED=true
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## API Reference

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
```

### Complaints
```
POST   /api/complaints               — Create complaint (supports file upload)
POST   /api/complaints/quick-file    — AI-formatted quick complaint
POST   /api/complaints/ai-categorize — Analyze text, return category + priority
GET    /api/complaints               — All complaints (admin) / user's own
GET    /api/complaints/:id
GET    /api/complaints/:id/letter    — Download PDF letter
PUT    /api/complaints/:id/status
DELETE /api/complaints/:id
```

### AI Calling
```
POST   /api/calls/:id/request-permission   — Generate script, await user approval
POST   /api/calls/confirm-call             — Place real call (or demo)
GET    /api/calls/:id                      — Get call log + transcript
GET    /api/calls                          — All logs (admin)

# Twilio webhooks (called by Twilio, no auth)
POST   /api/calls/twiml/start/:callLogId
POST   /api/calls/twiml/respond/:callLogId/:step
POST   /api/calls/status/:callLogId
POST   /api/calls/recording/:callLogId
```

### AQI Monitor
```
GET    /api/aqi?lat=18.5&lon=73.8          — By coordinates
GET    /api/aqi/city?name=Pune             — By city name
GET    /api/aqi/cities                     — 12 major Indian cities
GET    /api/aqi/forecast?lat=18.5&lon=73.8 — 5-day forecast
```

### Government Portal
```
POST   /api/gov/submit/:id         — Submit complaint to portal
GET    /api/gov/status/:id         — Check portal status
GET    /api/gov/my-tickets
POST   /api/gov/track-manual
```

### Automation
```
GET    /api/automation/rules
PUT    /api/automation/rules/:id   — Toggle rule on/off
GET    /api/automation/logs
POST   /api/automation/run-now     — Manual trigger
```

### Chatbot
```
POST   /api/chatbot/chat           — Send message, get AI reply
```

---

## Feature Details

### AI Calling Flow

```
User clicks "Call Department"
       ↓
POST /api/calls/:id/request-permission
  → Groq generates phone script
  → Returns script preview to user
       ↓
User reads script + approves
       ↓
POST /api/calls/confirm-call
  → ngrok tunnel auto-active (started on server boot)
  → Twilio places real call
  → ElevenLabs generates audio for each step
       ↓
Officer answers
  → /twiml/start plays intro audio
  → /twiml/respond handles each exchange (Groq generates dynamic replies)
  → Conversation logged to CallLog.conversationLog[]
       ↓
Call ends
  → /status webhook updates duration
  → /recording webhook saves recording URL
  → Deepgram transcribes with speaker labels
  → Groq summarizes in 3 bullets
  → Complaint status auto-updated based on officer's words
  → User notified in-app
```

### AQI Indian Scale Calculation

OpenWeatherMap returns WHO AQI (1–5). JantaVoice converts PM2.5 readings to the Indian National AQI (0–500) scale:

| Indian AQI | PM2.5 (µg/m³) | Category |
|---|---|---|
| 0–50 | 0–30 | Good |
| 51–100 | 30–60 | Satisfactory |
| 101–200 | 60–90 | Moderate |
| 201–300 | 90–120 | Poor |
| 301–400 | 120–250 | Very Poor |
| 401–500 | 250+ | Severe |

### Escalation Timeline

```
Complaint filed
  → Day 3: Automated reminder sent to department
  → Day 5: Escalated to higher authority
  → Day 7: Filed on state portal (CPGRAMS / PGPortal)
  → Gov portal checked every 10 minutes for status updates
```

---

## API Key Status

| Service | Status | Get It |
|---|---|---|
| Groq AI | ✅ Required | [console.groq.com](https://console.groq.com) — free |
| ngrok | ✅ Required for calls | [dashboard.ngrok.com](https://dashboard.ngrok.com) — free |
| Twilio | ⚠️ Optional | [twilio.com/try-twilio](https://twilio.com/try-twilio) — $15 free credit |
| ElevenLabs | ⚠️ Optional | [elevenlabs.io](https://elevenlabs.io) — 10k chars/month free |
| Deepgram | ⚠️ Optional | [console.deepgram.com](https://console.deepgram.com) — $200 free credit |
| OpenWeather | ⚠️ Optional | [openweathermap.org/api](https://openweathermap.org/api) — free tier (2hr activation) |

> **All optional services have demo modes.** The full UI works without them — you'll see clearly labeled demo data.

---

## Roadmap

- [ ] WhatsApp complaint filing via Twilio WhatsApp API
- [ ] Hindi voice support (Deepgram Hindi model)
- [ ] SMS status updates
- [ ] Multi-city complaint grouping (if 10+ complaints in same area, auto-escalate)
- [ ] Public complaint map (anonymized, city-level heatmap)
- [ ] RTI (Right to Information) request auto-generator
- [ ] Mobile app (React Native)

---

## Contributing

Pull requests are welcome. For major changes, open an issue first.

---

## License

MIT © JantaVoice 2024

---

<div align="center">
  <sub>Built with ❤️ for Indian citizens. Jai Hind 🇮🇳</sub>
</div>
