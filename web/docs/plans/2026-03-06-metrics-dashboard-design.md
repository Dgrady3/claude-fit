# Metrics Dashboard Design

## Goal

A dedicated `/metrics` page with 12 charts across 4 sections (Training, Recovery, Nutrition, Activity) providing comprehensive fitness analytics. Whoop/Oura-style sectioned scroll with sticky Week/Month/Quarter tabs.

## Architecture

Single scrollable page with distinct card-based chart sections. One backend API endpoint (`GET /api/v1/metrics?range=7d|30d|90d`) returns all data in a single payload. Frontend uses Recharts (already installed) for all visualizations. Dark theme consistent with existing design system.

## Page Structure

- **Route:** `/metrics` with pulse/chart nav icon in bottom nav + sidebar
- **Header:** "Metrics" title with sticky `[Week] [Month] [Quarter]` tab bar
- **Sections:** Training, Recovery, Nutrition, Activity — each in its own card group
- **Responsive:** Charts full-width on mobile, maintain readability at all sizes

## Chart Specifications

### Training Section

**1. Lift Progression (scatter + trend line)**
- Exercise selector dropdown (populated from user's exercise history)
- Scatter plot: each session's top weight as a dot
- Smooth trend line through data points
- PR markers highlighted with gold accent
- Tooltip: date, weight x reps, estimated 1RM (Epley formula)
- Axes: dates (x), weight lbs (y)

**2. Volume Trend (bar chart)**
- Total volume (weight x reps) per session as cyan bars
- Horizontal reference line at average volume
- Tooltip: date, total volume, set count

**3. Workout Frequency (dot grid)**
- Row of circles for each day in range
- Filled cyan = trained, empty gray outline = rest
- Shows consistency at a glance

### Recovery Section

**4. Sleep Score + Duration (dual-axis line)**
- Left axis: sleep score (0-100) as colored line (green 80+, amber 60-79, red <60)
- Right axis: total hours as subtle area fill
- Tooltip: date, score, hours:minutes

**5. Sleep Stages (stacked area)**
- Deep (indigo), REM (purple), Light (slate), Awake (red accent)
- Minutes per stage stacked nightly
- Tooltip: stage breakdown for each night

**6. HRV Trend (line + band)**
- Daily HRV as primary line
- Shaded band showing +/- 1 standard deviation (normal range)
- 7-day rolling average as dashed secondary line
- Anomaly days (outside band) visually highlighted

**7. Resting Heart Rate (line)**
- Simple line chart, lower is better
- Color: emerald when trending down, red when up
- Tooltip: date, bpm

### Nutrition Section

**8. Calories vs Target (bar + reference)**
- Daily calories as bars
- Horizontal reference line at calorie target
- Bar colors: green (within +/-100), amber (+/-300), red (over)

**9. Macro Breakdown (stacked area)**
- Protein (cyan), Carbs (amber), Fat (emerald) as stacked bands
- Daily gram values over time

**10. Protein per lb Bodyweight (line + zone)**
- Daily protein / bodyweight as line
- Green shaded band at 0.8-1.2 g/lb target zone
- Shows whether hitting optimal range

### Activity Section

**11. Daily Steps (bar + targets)**
- Bar chart per day
- Horizontal lines at 8,000 and 10,000 step targets
- Bars colored: green (10k+), cyan (8-10k), gray (<8k)

**12. Active Calories (area)**
- Area chart with gradient fill (cyan to transparent)
- Daily active calories burned

## Backend API

**Endpoint:** `GET /api/v1/metrics?range=7d|30d|90d`

**Response shape:**
```json
{
  "training": {
    "sessions": [{ "date", "volume", "duration_minutes", "muscle_groups" }],
    "exercise_history": {
      "<exercise_name>": [{ "date", "max_weight", "max_reps", "estimated_1rm", "volume", "sets" }]
    },
    "exercises": ["Bench Press", "Squat", ...]
  },
  "recovery": {
    "sleep": [{ "date", "sleep_score", "total_minutes", "deep_minutes", "rem_minutes", "light_minutes", "awake_minutes", "efficiency" }],
    "readiness": [{ "date", "readiness_score", "hrv_average", "resting_heart_rate", "body_temperature_delta" }]
  },
  "nutrition": {
    "daily": [{ "date", "calories", "protein_g", "carbs_g", "fat_g" }],
    "targets": { "calories": 2400, "protein_g": 180 }
  },
  "activity": {
    "daily": [{ "date", "steps", "active_calories", "total_calories", "active_minutes" }]
  },
  "user": { "body_weight_lbs": 185 }
}
```

## Visual Design Rules

- Card backgrounds: `dark-800`, borders: `dark-600/40`
- Grid lines: `rgba(255,255,255,0.06)` — nearly invisible
- Primary accent: cyan-400 (`#22d3ee`)
- Positive: emerald-400, Caution: amber-400, Negative: red-400
- Chart animation: 800ms ease-out on mount
- Custom tooltips matching existing dark toast style (`dark-700` bg, gray-200 text)
- Font: JetBrains Mono for data values, Inter for labels
- Charts responsive: full-width on mobile, maintain aspect ratio

## Tech Stack

- Recharts v3 (already installed)
- Framer Motion for section entrance animations
- date-fns for date formatting
- TanStack Query for data fetching + caching
- New `useMetrics(range)` hook
