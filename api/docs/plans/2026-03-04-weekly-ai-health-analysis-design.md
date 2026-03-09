# Weekly AI Health Analysis Design

**Goal:** Generate a weekly AI-powered body composition analysis that reviews workouts, nutrition, and Oura recovery data to identify trends and actionable insights for muscle gain / fat loss goals.

## Architecture

A `WeeklyAnalysisService` gathers two weeks of data (current week + previous week for comparison), builds a body-composition-focused prompt, and sends it to Claude. The result is stored in the existing `daily_reports` table with `report_type: "weekly"`. A `WeeklyAnalysisJob` runs every Sunday at 10 PM via sidekiq-scheduler.

## Data Gathering

For both current and previous week:
- **Workouts:** Sessions, sets, volume per muscle group, progressive overload detection
- **Nutrition:** Daily averages (calories, protein, carbs, fat), adherence to targets
- **Oura Sleep:** Average sleep score, total/deep/REM minutes
- **Oura Readiness:** Average readiness score, HRV, resting heart rate
- **Oura Activity:** Average steps, active calories
- **User goals:** Target weight, body fat, daily protein/calorie targets

## AI Prompt Focus (Body Composition)

- Weight trajectory toward target
- Protein adherence consistency
- Caloric balance relative to goals (surplus for muscle gain, deficit for fat loss)
- Training volume trends and progressive overload
- Recovery signals (sleep/HRV supporting training load?)
- Week-over-week deltas
- 3-5 actionable recommendations for next week

## Scoring

Same structure as daily reports:
- `overall` (1-100), `nutrition` (1-10), `sleep` (1-10), `recovery` (1-10), `training` (1-10)

## Changes

1. **Migration:** Add `report_type` (string, default "daily") to `daily_reports`
2. **Model:** Add scopes for `daily`/`weekly` report types
3. **Service:** New `WeeklyAnalysisService`
4. **Job:** New `WeeklyAnalysisJob` — Sundays at 10 PM
5. **Controller:** Filter by type, add `generate_weekly` action
6. **Routes:** Add `post :generate_weekly` to daily_reports collection

## Key Decisions

- Reuse `daily_reports` table (same data shape) rather than creating a new table
- Body composition focus (weight/nutrition/training correlation) over performance or recovery focus
- Week-over-week comparison (this week vs last week) for trend direction
- In-app delivery only, no email
- Sunday evening generation so the report covers Mon-Sun
