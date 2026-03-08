/*
FREE API KEYS SETUP GUIDE FOR JANTAVOICE
=========================================

1. GROQ (AI Brain) — Already configured ✅
   URL: https://console.groq.com
   Free: Unlimited requests, rate limited
   Add to .env: GROQ_API_KEY=gsk_...

2. TWILIO (Real Calls) — $15 free trial credit
   URL: https://twilio.com/try-twilio
   Steps:
   a) Sign up for free trial
   b) Verify your phone number
   c) Get a Twilio phone number (free with trial)
   d) Console → Account Info → copy SID + Auth Token
   e) Add to .env:
      TWILIO_ACCOUNT_SID=ACxxxxxxxx
      TWILIO_AUTH_TOKEN=your_token
      TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   Note: Trial account can only call verified numbers.
         Add officer test number at twilio.com/console/phone-numbers/verified

3. ELEVENLABS (Natural AI Voice) — 10,000 chars/month free
   URL: https://elevenlabs.io
   Steps:
   a) Sign up free
   b) Profile → API Key → copy
   c) Voice Library → pick a voice → copy Voice ID
   d) Add to .env:
      ELEVENLABS_API_KEY=your_key
      ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
   Note: Without this, app uses Twilio's Polly.Aditi voice (also good)

4. DEEPGRAM (Transcription) — $200 free credit
   URL: https://console.deepgram.com
   Steps:
   a) Sign up free
   b) Create Project → API Keys → Create Key
   c) Add to .env:
      DEEPGRAM_API_KEY=your_key
   Note: Without this, app uses demo transcript

5. OPENWEATHER (AQI Widget) — Free tier
   URL: https://openweathermap.org/api
   Steps:
   a) Sign up free
   b) API Keys tab → copy default key
   c) Wait 2 hours for activation
   d) Add to .env:
      OPENWEATHER_API_KEY=your_key

6. NGROK (Local Dev Webhooks) — Free
   URL: https://ngrok.com
   Steps:
   a) Install: npm install -g ngrok
   b) Sign up and get auth token
   c) ngrok config add-authtoken YOUR_TOKEN
   d) Run: node utils/ngrokSetup.js
   This sets PUBLIC_URL automatically in .env

TESTING WITHOUT REAL CALLS:
- The app works fully in demo mode without Twilio
- AI script generation, transcripts, all UI features work
- Only actual phone call is skipped in demo mode
- Set TEST_OFFICER_PHONE=your_own_number to test real calls to yourself
*/
