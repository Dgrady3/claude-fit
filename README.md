# Claude-Fit

AI-powered fitness intelligence that cross-references your training, nutrition, sleep, and recovery data to help you build muscle and lose fat.

![Claude-Fit Screenshot](docs/screenshot.png)
<!-- Replace with an actual screenshot of the dashboard or reports page -->

## Tech Stack

| Layer     | Stack |
|-----------|-------|
| Frontend  | React 19, Vite 7.3, Tailwind CSS v4, Framer Motion, TanStack Query v5, Recharts |
| Backend   | Ruby on Rails 7.2 (API-only), Ruby 3.3.8, PostgreSQL, Sidekiq + Redis |
| AI        | Anthropic Claude API (`anthropic-sdk-beta`) |
| Auth      | Devise + JWT |
| Infra     | Docker Compose for local dev |

## Features

- **AI Daily Health Reports** -- Claude analyzes your recent workouts, nutrition, sleep, and recovery to generate reports with root cause analysis and actionable recommendations
- **Workout Tracking** -- Log sets/reps/weight with progressive overload detection and exercise insights
- **Training Programs** -- Create and manage structured workout programs with ordered exercises
- **Nutrition Logging** -- Manual food entry plus MyFitnessPal CSV import
- **Body Composition Metrics** -- Track weight, body fat, and other measurements with trend analysis
- **Sleep & Recovery Analytics** -- Oura Ring integration for sleep and readiness data
- **12+ Analytics Charts** -- Comprehensive reports page with volume, strength, nutrition, and recovery visualizations
- **Athlete Card** -- Shareable snapshot of your current stats
- **ChatGPT Health Context Import** -- Bring in health conversation history for richer AI analysis
- **Demo Mode** -- Full walkthrough with seed data for portfolio viewing (no account required)

## Architecture

```
grokfit/
├── web/          # React SPA (Vite)
├── api/          # Rails 7.2 API-only
├── docker-compose.yml
└── Procfile.dev
```

The frontend is a single-page app that communicates with the Rails API over JSON. Authentication uses JWT tokens via Devise. Background jobs (Sidekiq) handle AI report generation and data imports. The Rails API talks to the Anthropic Claude API to produce daily health reports.

**Key models:** User, WorkoutProgram, WorkoutSession, SessionSet, Exercise, NutritionEntry, DailyReport, OuraSleepDatum, OuraReadinessDatum, Metrics (body composition), Anomaly, VideoKnowledge

## Getting Started

### Prerequisites

- Ruby 3.3.8
- Node.js 20+
- PostgreSQL
- Redis

### Backend

```bash
cd api
bundle install
cp .env.example .env        # add your ANTHROPIC_API_KEY and database creds
rails db:create db:migrate db:seed
bin/rails server -p 3000
```

### Frontend

```bash
cd web
npm install
npm run dev                  # starts on http://localhost:5173
```

### Full Stack (Docker Compose)

```bash
docker compose up
```

Or use the Procfile:

```bash
# requires foreman or overmind
foreman start -f Procfile.dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for health report generation |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (Sidekiq) |
| `DEVISE_JWT_SECRET_KEY` | Secret for JWT token signing |

## Demo

Visit the live app and click **Try Demo** to explore with pre-loaded sample data -- no account required.

## GitHub

[github.com/Dgrady3/claude-fit](https://github.com/Dgrady3/claude-fit)

## License

MIT
