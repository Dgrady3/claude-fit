# Claude-Fit

AI-powered fitness intelligence. Claude-Fit cross-references your training, nutrition, sleep, and recovery data to help you build lean muscle and lose fat — backed by real analysis, not generic advice.

> **[Try the live demo](https://claude-fit.vercel.app/demo)** — no account required

## What It Does

Claude-Fit connects to your fitness data and uses the Anthropic Claude API to generate personalized daily and weekly health reports. It identifies root causes behind plateaus, tracks progressive overload across exercises, and ties your nutrition, sleep, and recovery together into actionable recommendations.

**Core features:**
- AI daily/weekly health reports with scoring and root cause analysis
- Workout logging with progressive overload tracking
- Nutrition tracking + MyFitnessPal CSV import
- Oura Ring integration (sleep, HRV, readiness, activity)
- ChatGPT health context import for personalized AI analysis
- Body composition metrics and trend charts
- Anomaly detection (flags unusual patterns in your data)
- Shareable Athlete Card
- Demo mode with realistic seed data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Tailwind CSS v4, Framer Motion, TanStack Query v5, Recharts |
| Backend | Rails 7.2 (API-only), Ruby 3.3, PostgreSQL, Sidekiq + Redis |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Auth | Devise + JWT |
| Deploy | Railway (API + Postgres + Redis), Vercel (frontend) |

## Architecture

```
claude-fit/
├── api/              # Rails 7.2 API-only backend
│   ├── app/
│   │   ├── controllers/api/v1/   # JSON API endpoints
│   │   ├── models/               # 18 ActiveRecord models
│   │   └── services/             # Claude AI, Oura sync, imports
│   └── db/
│       ├── schema.rb
│       └── seeds.rb              # Demo data (60+ days)
├── web/              # React SPA
│   ├── src/
│   │   ├── pages/                # 13 pages (lazy-loaded)
│   │   ├── api/                  # API client + React Query hooks
│   │   └── components/           # Shared UI components
│   └── landing-preview/          # Standalone landing page
├── docker-compose.yml            # Local Postgres + Redis
└── Procfile.dev                  # API + frontend + Sidekiq
```

The frontend communicates with the Rails API over JSON. JWT tokens handle auth. Sidekiq processes background jobs (AI report generation, data syncs). The Claude API receives a structured prompt containing the user's health data window and returns scored analysis with recommendations.

## Local Development

### Prerequisites

- Ruby 3.3.8 / Node.js 20+
- PostgreSQL / Redis

### Quick Start

```bash
# Start Postgres + Redis
docker compose up -d

# Backend
cd api
bundle install
cp .env.example .env   # add ANTHROPIC_API_KEY
rails db:create db:migrate db:seed
bin/rails server -p 3000

# Frontend (separate terminal)
cd web
npm install
npm run dev            # http://localhost:5173
```

Or use `foreman start -f Procfile.dev` to run everything at once.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for report generation |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis for Sidekiq background jobs |
| `DEVISE_JWT_SECRET_KEY` | Yes | JWT token signing secret |
| `RAILS_MASTER_KEY` | Prod | Rails credentials encryption key |
| `OURA_CLIENT_ID` | No | Oura Ring OAuth client ID |
| `OURA_CLIENT_SECRET` | No | Oura Ring OAuth client secret |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/sign_in` | Login (returns JWT) |
| POST | `/api/v1/auth` | Register |
| GET | `/api/v1/me` | Current user profile |
| GET/POST | `/api/v1/workout_sessions` | Workout session CRUD |
| GET/POST | `/api/v1/nutrition_entries` | Nutrition logging |
| POST | `/api/v1/nutrition_entries/import` | MFP CSV import |
| POST | `/api/v1/health_contexts/import` | ChatGPT context import |
| POST | `/api/v1/daily_reports/generate` | Generate AI daily report |
| POST | `/api/v1/daily_reports/generate_weekly` | Generate AI weekly report |
| GET | `/api/v1/metrics` | Training/nutrition/recovery charts |
| GET | `/api/v1/athlete_card` | Shareable stats card |
| GET | `/api/v1/insights/root_cause` | AI bottleneck analysis |

## License

MIT
