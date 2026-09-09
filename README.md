# LIFE UPGRADE V2.0

> Your Personal AI Discipline Coach

LIFE UPGRADE is a mobile-first personal growth and wellbeing web application. It helps users build disciplined routines, improve focus, track habits, control unhealthy patterns, and work towards a stronger daily lifestyle.

## What changed in V2.0

### New UI/UX

* Redesigned premium mobile-first interface
* Floating bottom navigation
* Updated navigation flow:

  * Today
  * Journey
  * Insights
  * Coach
  * Profile
* Improved app header, spacing, premium cards, shadows, and hierarchy
* Cleaner, less cluttered dashboard experience
* One clear next action instead of showing too many tasks together

### Today Dashboard Redesign

* Premium discipline score card
* Current streak and growth level
* “Your Next Step” section
* Primary action button: **Start Next Step**
* Daily mission and level progress
* Mood check-in
* Habit quick check-ins
* Personal Coach shortcut

### Personal AI Coach

* Renamed from **LIFE AI COACH** to **Personal AI Coach**
* Coach is designed to provide practical daily support in Hindi, Hinglish, and English
* Uses routine, goals, work timing, sleep, mood, focus, habits, streaks, and limits as context
* Helps users with:

  * Daily planning
  * Better routine
  * Low energy days
  * Focus improvement
  * Smoking/drinking reduction guidance
  * Scrolling control
  * Weekly planning
  * Confidence building
* Missing AI configuration no longer crashes the app or creates a blank screen
* Shows a safe message when the Personal AI Coach is not configured
* Voice replies now show a clearer unavailable state if TTS setup is missing

> Note: Browser voice input and voice replies work while the app is open. True continuous background microphone support requires a native Android application and is not promised in the web PWA.

### SaaS Pricing Update

| Plan                  |         Price | Includes                                                               |
| --------------------- | ------------: | ---------------------------------------------------------------------- |
| Free                  |            ₹0 | Basic routine, habits, mood, streaks and limits                        |
| Starter Lifetime      | ₹299 one-time | Lifetime tracking, insights and challenges with 15 one-time AI credits |
| Personal Coach        |    ₹199/month | Personal AI Coach, weekly reviews and fair-use AI credits              |
| Personal Coach Yearly |   ₹1,499/year | Full Personal Coach access at a yearly discount                        |

> Starter Lifetime does not include unlimited AI access. This keeps the product sustainable because AI usage has ongoing costs.

## Core Features

* Daily routine planner
* Habit tracking and streaks
* Focus timer
* Mood check-ins
* Control & Reduction Plan for scrolling, smoking, alcohol, junk food, gaming, and custom habits
* Progress reports
* Weekly performance insights
* Premium Personal AI Coach
* Voice input and text chat
* Cloud sync with Supabase
* Secure authentication
* Cashfree subscription and payment support
* Installable PWA support

## Tech Stack

* React
* TypeScript
* Vite
* TanStack Router / TanStack Start
* Tailwind CSS
* Supabase Auth and Database
* Cashfree Payments
* Gemini AI
* Lovable TTS Gateway
* PWA / Service Worker

## Environment Variables

Create a `.env` file locally. Never upload this file to GitHub.

```env
GEMINI_API_KEY=
LOVABLE_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
```

* `GEMINI_API_KEY` is required for Personal AI Coach replies.
* `LOVABLE_API_KEY` is required only for TTS voice replies.
* Never use `VITE_` prefixes for secret server keys.

## Run Locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Safety Note

LIFE UPGRADE supports personal wellbeing and is not a substitute for medical or mental-health care. The app does not secretly monitor calls, messages, browsing history, microphone activity, or any private user activity.

## Roadmap

* Secure Coach Memory with view/edit/delete controls
* AI credits and per-user usage limit
* 30-Day Transformation Challenges
* Weekly AI Upgrade Report
* Export progress report as image/PDF
* Referral system
* Admin analytics dashboard
* Native Android app for stronger voice support
