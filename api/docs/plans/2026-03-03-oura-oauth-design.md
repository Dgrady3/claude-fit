# Oura OAuth Integration Design

**Goal:** Wire up the Oura Ring OAuth flow so users can connect their ring and sync sleep/readiness/activity data into GrokFit.

## What Already Exists

- `OuraOAuthService` — generates auth URL, exchanges code for tokens, refreshes tokens
- `OuraSyncService` — pulls sleep/readiness/activity from Oura API v2
- `OauthToken` model with Lockbox encryption for access/refresh tokens
- `OuraSleepDatum`, `OuraReadinessDatum`, `OuraActivityDatum` models + migrations
- `NightlySyncJob` — nightly sync for all connected users
- Frontend Settings page with "Connect Oura" button pointing to `/api/v1/oura/authorize`

## What Needs to Be Built

1. **OauthController** with 3 actions:
   - `GET /api/v1/oura/authorize` — redirects to Oura consent page
   - `GET /api/v1/oura/callback` — exchanges auth code for tokens, redirects to frontend Settings
   - `POST /api/v1/oura/sync` — manually triggers OuraSyncService

2. **Routes** — add OAuth routes to routes.rb

3. **User serializer** — expose `oura_connected` boolean so frontend knows connection state

4. **Frontend Settings update** — show connected state, add "Sync Now" button, handle callback redirect

## Key Decisions

- Callback redirects to frontend `/settings?oura=connected` so the UI can show success
- Manual sync runs inline (not background job) since it's user-triggered and fast
- No new migrations needed — all models/tables exist
