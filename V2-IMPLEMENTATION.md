# LIFE UPGRADE V2.0

## Applied in this package

- Renamed the core experience to **Personal AI Coach**.
- Reframed the bottom navigation around the V2 journey: Today, Journey, Insights, Coach and Profile.
- Updated pricing so `Starter Lifetime` is **₹299** and is explicitly a tracking product with 15 one-time AI credits, not an unsustainable unlimited-AI promise.
- Added `Personal Coach` monthly (₹199) and annual (₹1,499) plan positioning.
- Reworked the Coach language so it promises practical voice input/replies while the app is open, not impossible always-listening browser background audio.
- Changed missing Gemini configuration from a server crash into a safe, user-facing Coach state.
- Changed Gemini provider errors into safe Coach results rather than exposing raw provider errors to the UI.
- Changed missing TTS configuration to a clear temporary-unavailable response.

## Required environment variables

```env
GEMINI_API_KEY=
LOVABLE_API_KEY= # required only for voice replies through the Lovable TTS gateway
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
```

Never use `VITE_` for server secrets.

## Required next implementation work before public SaaS launch

1. Add server-side entitlement verification for every AI and TTS request.
2. Add per-user AI credits, rate limits and `ai_usage_logs`.
3. Add Coach memory tables with user view/edit/delete controls.
4. Build the new onboarding, Challenges and Insight reports described in the V2 brief.
5. Add payment webhook event logs and idempotency.
6. Regenerate Supabase types after adding migrations.

## Quick local check

```sh
npm install
npm run build
```

If the Personal AI Coach says it is being configured, add `GEMINI_API_KEY` to the server environment and restart the dev server.
