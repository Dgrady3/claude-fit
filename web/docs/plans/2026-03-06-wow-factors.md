# Wow Factor Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 portfolio-impressing features: readiness recommendation, body comp simulator, root cause engine, athlete card, PWA offline support, and anomaly detection feed.

**Architecture:** Mix of frontend-only interactive tools, new Rails endpoints with AI integration, and PWA infrastructure. Each feature is independent.

**Tech Stack:** React 19, Recharts, Framer Motion, Rails 7.2, Claude API, vite-plugin-pwa, Web Audio API

---

### Task 1: Readiness-Adjusted Workout Recommendation

A banner on the workout logger and dashboard showing today's readiness status with a training recommendation based on Oura data vs personal baseline.

**Files:**
- Create: `api/app/controllers/api/v1/readiness_controller.rb`
- Modify: `api/config/routes.rb`
- Create: `web/src/components/ReadinessBanner.jsx`
- Modify: `web/src/pages/Dashboard.jsx`
- Modify: `web/src/pages/ProgramDetail.jsx`

**Step 1: Create readiness endpoint**

```ruby
# api/app/controllers/api/v1/readiness_controller.rb
module Api
  module V1
    class ReadinessController < BaseController
      def today
        today_readiness = current_user.oura_readiness_data.find_by(date: Date.current)
        today_sleep = current_user.oura_sleep_data.find_by(date: Date.current)

        # 30-day baseline
        baseline_data = current_user.oura_readiness_data
          .where(date: 30.days.ago.to_date..Date.yesterday)

        baseline_hrv = baseline_data.average(:hrv_average)&.to_f
        baseline_rhr = baseline_data.average(:resting_heart_rate)&.to_f
        baseline_readiness = baseline_data.average(:readiness_score)&.to_f

        unless today_readiness
          return render json: { available: false }
        end

        hrv_delta_pct = baseline_hrv&.positive? ?
          (((today_readiness.hrv_average.to_f - baseline_hrv) / baseline_hrv) * 100).round(1) : nil

        rhr_delta = baseline_rhr ?
          (today_readiness.resting_heart_rate.to_i - baseline_rhr).round(1) : nil

        # Simple recommendation logic
        score = today_readiness.readiness_score.to_i
        level = if score >= 85 then "peak"
                elsif score >= 70 then "good"
                elsif score >= 55 then "moderate"
                else "low"
                end

        recommendation = case level
        when "peak"
          "Readiness is excellent — great day to push intensity or attempt PRs."
        when "good"
          "Recovery looks solid. Train as planned."
        when "moderate"
          "Recovery is below average. Consider reducing volume by 15-20% or focusing on technique work."
        when "low"
          "Your body needs recovery. Light movement or rest day recommended."
        end

        render json: {
          available: true,
          level: level,
          readiness_score: score,
          sleep_score: today_sleep&.sleep_score,
          hrv: today_readiness.hrv_average&.to_f&.round(0),
          hrv_delta_pct: hrv_delta_pct,
          resting_hr: today_readiness.resting_heart_rate,
          rhr_delta: rhr_delta,
          recommendation: recommendation,
          baseline: {
            hrv: baseline_hrv&.round(0),
            resting_hr: baseline_rhr&.round(0),
            readiness: baseline_readiness&.round(0)
          }
        }
      end
    end
  end
end
```

Add route in `config/routes.rb`:
```ruby
get "readiness/today", to: "readiness#today"
```

**Step 2: Create ReadinessBanner component**

```jsx
// web/src/components/ReadinessBanner.jsx
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const LEVEL_CONFIG = {
  peak: { color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: '↑' },
  good: { color: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', icon: '→' },
  moderate: { color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: '↓' },
  low: { color: 'red', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: '↓↓' },
};

export default function ReadinessBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ['readinessToday'],
    queryFn: () => api.get('/readiness/today'),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading || !data?.available) return null;

  const config = LEVEL_CONFIG[data.level] || LEVEL_CONFIG.good;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bg} ${config.border} border rounded-xl p-4 space-y-2`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${config.text}`}>{data.readiness_score}</span>
          <span className="text-xs text-gray-400">Readiness</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          {data.hrv && (
            <span className="text-gray-400">
              HRV {data.hrv}
              {data.hrv_delta_pct != null && (
                <span className={data.hrv_delta_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {' '}{data.hrv_delta_pct > 0 ? '+' : ''}{data.hrv_delta_pct}%
                </span>
              )}
            </span>
          )}
          {data.sleep_score && (
            <span className="text-gray-400">Sleep {data.sleep_score}</span>
          )}
        </div>
      </div>
      <p className={`text-sm ${config.text}`}>{data.recommendation}</p>
    </motion.div>
  );
}
```

**Step 3: Add to Dashboard and ProgramDetail**

In Dashboard.jsx, add `<ReadinessBanner />` after the greeting section (before "Today's Plan").

In ProgramDetail.jsx, add `<ReadinessBanner />` above the "Start Workout" button area.

**Step 4: Commit**

---

### Task 2: Body Composition Trajectory Simulator

An interactive "what if" tool with sliders on the Metrics page. Pure frontend math.

**Files:**
- Create: `web/src/components/BodyCompSimulator.jsx`
- Modify: `web/src/pages/Metrics.jsx`

**Step 1: Create the simulator component**

```jsx
// web/src/components/BodyCompSimulator.jsx
import { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Card from './Card';

function Slider({ label, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-200 font-mono">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-dark-600 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-400/30"
      />
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium mb-1">Week {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toFixed(1)} lbs</p>
      ))}
    </div>
  );
}

export default function BodyCompSimulator({ currentWeight = 185, bodyFatPct = 20 }) {
  const [deficit, setDeficit] = useState(300);
  const [protein, setProtein] = useState(160);
  const [weeks, setWeeks] = useState(12);
  const [trainingDays, setTrainingDays] = useState(4);

  const projections = useMemo(() => {
    const data = [];
    let weight = currentWeight;
    let fatMass = weight * (bodyFatPct / 100);
    let leanMass = weight - fatMass;

    // Mifflin-St Jeor base BMR (male approximation, can refine)
    const bmr = 10 * (weight * 0.453592) + 6.25 * 175 - 5 * 30 + 5; // rough
    const activityMultiplier = 1.2 + (trainingDays * 0.05);
    const tdee = bmr * activityMultiplier;

    // Protein adequacy affects muscle retention
    const proteinPerLb = protein / weight;
    const muscleRetention = Math.min(1, proteinPerLb / 1.0); // 1.0 g/lb = full retention

    for (let w = 0; w <= weeks; w++) {
      data.push({
        week: w,
        weight: Math.round(weight * 10) / 10,
        fatMass: Math.round(fatMass * 10) / 10,
        leanMass: Math.round(leanMass * 10) / 10,
        bodyFat: Math.round((fatMass / weight) * 1000) / 10,
      });

      // Weekly changes
      const weeklyDeficit = deficit * 7;
      const fatLossLbs = (weeklyDeficit * 0.85) / 3500; // ~85% from fat
      const muscleLossLbs = (weeklyDeficit * 0.15) / 3500; // ~15% from muscle

      // Training + protein can offset muscle loss and even add lean mass
      const muscleGainFromTraining = trainingDays >= 3 ? 0.05 * muscleRetention : 0;
      const adjustedMuscleLoss = Math.max(0, muscleLossLbs - muscleGainFromTraining) * (1 - muscleRetention * 0.5);

      fatMass = Math.max(fatMass - fatLossLbs, weight * 0.05);
      leanMass = leanMass - adjustedMuscleLoss + muscleGainFromTraining;
      weight = fatMass + leanMass;
    }

    return data;
  }, [currentWeight, bodyFatPct, deficit, protein, weeks, trainingDays]);

  const finalBF = projections[projections.length - 1]?.bodyFat;
  const weightLost = currentWeight - (projections[projections.length - 1]?.weight || currentWeight);

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Body Comp Simulator</h3>
        <span className="text-xs text-gray-600 font-mono">
          {finalBF?.toFixed(1)}% BF in {weeks}w • {weightLost > 0 ? '-' : '+'}{Math.abs(weightLost).toFixed(1)} lbs
        </span>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Slider label="Daily Deficit" value={deficit} onChange={setDeficit} min={0} max={1000} step={50} unit=" cal" />
        <Slider label="Daily Protein" value={protein} onChange={setProtein} min={80} max={250} step={5} unit="g" />
        <Slider label="Weeks" value={weeks} onChange={setWeeks} min={4} max={24} step={1} unit="w" />
        <Slider label="Training Days/wk" value={trainingDays} onChange={setTrainingDays} min={0} max={6} step={1} unit="d" />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={projections} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#f87171" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="leanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(w) => `W${w}`} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          <Area type="monotone" dataKey="leanMass" name="Lean Mass" stroke="#22d3ee" fill="url(#leanGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="fatMass" name="Fat Mass" stroke="#f87171" fill="url(#fatGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-gray-600 text-center">
        Estimates based on Mifflin-St Jeor equation. Actual results vary with genetics, adherence, and training intensity.
      </p>
    </Card>
  );
}
```

**Step 2: Add to Metrics page**

In `Metrics.jsx`, import `BodyCompSimulator` and add it after the Activity section:

```jsx
<SectionHeader title="Projections" />
<BodyCompSimulator
  currentWeight={data?.user?.body_weight_lbs || 185}
  bodyFatPct={20}
/>
```

**Step 3: Commit**

---

### Task 3: "What's Holding You Back?" Root Cause Engine

AI-powered insight card on the Dashboard that cross-references workout stalls with sleep/nutrition data.

**Files:**
- Create: `api/app/services/root_cause_service.rb`
- Create: `api/app/controllers/api/v1/insights_controller.rb`
- Modify: `api/config/routes.rb`
- Create: `web/src/components/InsightCard.jsx`
- Modify: `web/src/pages/Dashboard.jsx`

**Step 1: Create the root cause service**

```ruby
# api/app/services/root_cause_service.rb
class RootCauseService
  def call(user)
    end_date = Date.current
    start_date = end_date - 28.days

    # Gather data
    sessions = user.workout_sessions.completed
      .where(started_at: start_date.beginning_of_day..end_date.end_of_day)
      .includes(session_sets: :exercise)

    sleep_data = user.oura_sleep_data.where(date: start_date..end_date).order(:date)
    readiness_data = user.oura_readiness_data.where(date: start_date..end_date).order(:date)
    nutrition = user.nutrition_entries.where(date: start_date..end_date)

    # Build exercise trends (detect stalls)
    exercise_trends = build_exercise_trends(sessions)

    # Daily nutrition summary
    daily_nutrition = nutrition.group(:date).select(
      "date, SUM(calories) as calories, SUM(protein_g) as protein_g"
    ).order(:date).map { |r| { date: r.date, calories: r.calories.to_f, protein: r.protein_g.to_f } }

    data = {
      exercise_trends: exercise_trends,
      sleep: sleep_data.map { |s| { date: s.date, score: s.sleep_score, efficiency: s.efficiency&.to_f, total_hours: (s.total_sleep_minutes.to_f / 60).round(1) } },
      readiness: readiness_data.map { |r| { date: r.date, score: r.readiness_score, hrv: r.hrv_average&.to_f } },
      nutrition: daily_nutrition,
      user_weight: user.body_weight_lbs
    }

    response = ClaudeClient.new.chat(
      system: system_prompt,
      messages: [{ role: "user", content: JSON.pretty_generate(data) }],
      model: "claude-sonnet-4-20250514",
      max_tokens: 500
    )

    parsed = JSON.parse(response[:content].gsub(/```(?:json)?/i, "").strip, symbolize_names: true) rescue {
      title: "Keep pushing",
      insight: response[:content],
      severity: "info"
    }

    parsed
  end

  private

  def build_exercise_trends(sessions)
    all_sets = sessions.flat_map { |s| s.session_sets.working_sets }
    exercises = all_sets.group_by { |s| s.exercise.name }

    exercises.transform_values do |sets|
      by_week = sets.group_by { |s| s.workout_session.started_at.to_date.beginning_of_week(:monday) }
      weeks = by_week.sort_by(&:first).map do |week_start, week_sets|
        max_w = week_sets.map(&:weight_lbs).max
        { week: week_start, max_weight: max_w, volume: week_sets.sum { |s| s.weight_lbs * s.reps } }
      end
      weeks
    end
  end

  def system_prompt
    <<~PROMPT
      You are a body composition coach analyzing 4 weeks of training, sleep, and nutrition data to find the #1 factor limiting progress.

      Look for:
      - Exercise weight/volume stalls or regressions
      - Sleep score drops correlating with training stalls
      - Caloric deficit too aggressive (protein < 0.8g/lb or calories < BMR)
      - HRV downtrends indicating overtraining
      - Low sleep efficiency or total hours

      Respond with ONLY valid JSON:
      {
        "title": "Short 3-5 word headline",
        "insight": "2-3 sentence explanation connecting the data points causally. Be specific with numbers.",
        "severity": "warning|info|positive",
        "metric": "sleep|nutrition|training|recovery"
      }

      If everything looks good, give a positive insight about what's working well.
    PROMPT
  end
end
```

**Step 2: Create insights controller**

```ruby
# api/app/controllers/api/v1/insights_controller.rb
module Api
  module V1
    class InsightsController < BaseController
      def root_cause
        result = RootCauseService.new.call(current_user)
        render json: result
      end
    end
  end
end
```

Add route: `get "insights/root_cause", to: "insights#root_cause"`

**Step 3: Create InsightCard component**

```jsx
// web/src/components/InsightCard.jsx
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const SEVERITY_CONFIG = {
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', accent: 'text-amber-400', icon: '⚠' },
  info: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', accent: 'text-cyan-400', icon: '💡' },
  positive: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', accent: 'text-emerald-400', icon: '✓' },
};

export default function InsightCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['rootCause'],
    queryFn: () => api.get('/insights/root_cause'),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: false,
  });

  if (isLoading || !data?.title) return null;

  const config = SEVERITY_CONFIG[data.severity] || SEVERITY_CONFIG.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`${config.bg} ${config.border} border rounded-xl p-4 space-y-1.5`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{config.icon}</span>
        <h3 className={`text-sm font-semibold ${config.accent}`}>{data.title}</h3>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">{data.insight}</p>
    </motion.div>
  );
}
```

**Step 4: Add to Dashboard**

In Dashboard.jsx, import and add `<InsightCard />` after the ReadinessBanner.

**Step 5: Commit**

---

### Task 4: Shareable Athlete Card

A public endpoint that generates a stats summary card. For the portfolio demo, this is a frontend-rendered card with a "Copy Link" button.

**Files:**
- Create: `api/app/controllers/api/v1/athlete_card_controller.rb`
- Modify: `api/config/routes.rb`
- Create: `web/src/pages/AthleteCard.jsx`
- Modify: `web/src/App.jsx`

**Step 1: Create athlete card endpoint**

```ruby
# api/app/controllers/api/v1/athlete_card_controller.rb
module Api
  module V1
    class AthleteCardController < BaseController
      def show
        sessions = current_user.workout_sessions.completed
        all_sets = sessions.includes(session_sets: :exercise).flat_map { |s| s.session_sets.working_sets }

        # Best lifts (top weight per exercise, top 5)
        best_lifts = all_sets.group_by { |s| s.exercise.name }
          .transform_values { |sets| sets.map(&:weight_lbs).max }
          .sort_by { |_, w| -w }
          .first(5)
          .map { |name, weight| { exercise: name, weight: weight } }

        # Training streak (consecutive weeks with at least 1 workout)
        streak = calculate_streak(sessions)

        # Averages from last 30 days
        sleep_avg = current_user.oura_sleep_data.where(date: 30.days.ago.to_date..Date.current).average(:sleep_score)&.round(0)
        steps_avg = current_user.oura_activity_data.where(date: 30.days.ago.to_date..Date.current).average(:steps)&.round(0)

        render json: {
          name: current_user.name || "Athlete",
          total_sessions: sessions.count,
          total_volume: all_sets.sum { |s| s.weight_lbs * s.reps },
          best_lifts: best_lifts,
          streak_weeks: streak,
          avg_sleep_score: sleep_avg,
          avg_steps: steps_avg,
          member_since: current_user.created_at.strftime("%B %Y")
        }
      end

      private

      def calculate_streak(sessions)
        return 0 if sessions.empty?
        weeks_with_workouts = sessions.map { |s| s.started_at.to_date.beginning_of_week(:monday) }.uniq.sort.reverse
        streak = 0
        current_week = Date.current.beginning_of_week(:monday)
        weeks_with_workouts.each do |week|
          break if week < current_week - streak.weeks - 1.week
          streak += 1 if week == current_week - streak.weeks
        end
        streak
      end
    end
  end
end
```

Add route: `get "athlete_card", to: "athlete_card#show"`

**Step 2: Create AthleteCard page**

```jsx
// web/src/pages/AthleteCard.jsx
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import toast from 'react-hot-toast';

export default function AthleteCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['athleteCard'],
    queryFn: () => api.get('/athlete_card'),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-600/40 rounded-2xl p-6 space-y-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <span className="text-cyan-400 font-bold text-xl">GF</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-100">{data?.name}</h1>
            <p className="text-xs text-gray-500">Member since {data?.member_since}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatBlock label="Sessions" value={data?.total_sessions || 0} />
          <StatBlock label="Volume" value={`${((data?.total_volume || 0) / 1000).toFixed(0)}k`} unit="lbs" />
          <StatBlock label="Streak" value={data?.streak_weeks || 0} unit="weeks" />
        </div>

        {/* Best Lifts */}
        {data?.best_lifts?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Best Lifts</h3>
            <div className="space-y-1.5">
              {data.best_lifts.map((lift, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-300">{lift.exercise}</span>
                  <span className="text-sm font-mono text-cyan-400">{lift.weight} lbs</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery */}
        <div className="flex gap-4">
          {data?.avg_sleep_score && (
            <div className="flex-1 bg-dark-700/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-indigo-400">{data.avg_sleep_score}</p>
              <p className="text-[10px] text-gray-500 uppercase">Avg Sleep</p>
            </div>
          )}
          {data?.avg_steps && (
            <div className="flex-1 bg-dark-700/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">{data.avg_steps.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500 uppercase">Avg Steps</p>
            </div>
          )}
        </div>

        {/* Branding */}
        <div className="text-center pt-2 border-t border-dark-600/40">
          <span className="text-[10px] text-gray-600">Powered by GrokFit</span>
        </div>
      </motion.div>

      <button
        onClick={handleCopy}
        className="w-full py-3 rounded-xl bg-dark-800 border border-dark-600/40 text-sm text-gray-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
      >
        Copy Share Link
      </button>
    </div>
  );
}

function StatBlock({ label, value, unit }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-gray-100 font-mono">
        {value}
        {unit && <span className="text-xs text-gray-500 ml-0.5">{unit}</span>}
      </p>
      <p className="text-[10px] text-gray-500 uppercase mt-0.5">{label}</p>
    </div>
  );
}
```

**Step 3: Add route to App.jsx**

Import `AthleteCard` and add inside protected routes:
```jsx
<Route path="/athlete-card" element={<AthleteCard />} />
```

**Step 4: Commit**

---

### Task 5: PWA with Offline Support

Add service worker for asset caching and basic offline capability.

**Files:**
- Modify: `web/package.json` (add vite-plugin-pwa)
- Modify: `web/vite.config.js`
- Create: `web/public/manifest.json` (or configured via plugin)
- Modify: `web/src/main.jsx` (register SW)

**Step 1: Install vite-plugin-pwa**

```bash
cd /Users/joegrady/Development/projects/grokfit/web && npm install vite-plugin-pwa -D
```

**Step 2: Configure in vite.config.js**

Read the existing vite.config.js first, then add VitePWA plugin:

```js
import { VitePWA } from 'vite-plugin-pwa';

// Add to plugins array:
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico'],
  manifest: {
    name: 'GrokFit',
    short_name: 'GrokFit',
    description: 'AI-powered fitness tracking',
    theme_color: '#0a0a0f',
    background_color: '#0a0a0f',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/localhost:3000\/api\/v1\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
        },
      },
    ],
  },
})
```

**Step 3: Create simple PWA icons**

Create minimal SVG-based icons at `web/public/icon-192.png` and `web/public/icon-512.png`. For now, generate simple placeholder icons using canvas or just create colored squares with "GF" text. We can use a simple script or just note that real icons should be added later.

**Step 4: Commit**

---

### Task 6: Anomaly Detection Feed

Nightly background job that detects statistical anomalies, plus a notification drawer in the frontend.

**Files:**
- Create: `api/db/migrate/TIMESTAMP_create_anomalies.rb`
- Create: `api/app/models/anomaly.rb`
- Create: `api/app/jobs/anomaly_detection_job.rb`
- Create: `api/app/controllers/api/v1/anomalies_controller.rb`
- Modify: `api/config/routes.rb`
- Modify: `api/config/sidekiq.yml`
- Modify: `api/app/models/user.rb`
- Create: `web/src/components/AnomalyDrawer.jsx`
- Modify: `web/src/components/Layout.jsx`

**Step 1: Create migration**

```ruby
class CreateAnomalies < ActiveRecord::Migration[7.2]
  def change
    create_table :anomalies do |t|
      t.references :user, null: false, foreign_key: true
      t.date :date, null: false
      t.string :metric, null: false  # sleep_score, hrv, resting_hr, calories, protein, steps
      t.decimal :value, precision: 8, scale: 2
      t.decimal :baseline_mean, precision: 8, scale: 2
      t.decimal :z_score, precision: 4, scale: 2
      t.string :severity  # warning, critical
      t.string :message
      t.string :correlated_metric  # optional: another metric that was also anomalous
      t.datetime :dismissed_at
      t.timestamps
    end
    add_index :anomalies, [:user_id, :date, :metric], unique: true
  end
end
```

Run: `cd /Users/joegrady/Development/projects/grokfit/api && bin/rails db:migrate`

**Step 2: Create Anomaly model**

```ruby
# api/app/models/anomaly.rb
class Anomaly < ApplicationRecord
  belongs_to :user
  scope :active, -> { where(dismissed_at: nil) }
  scope :recent, -> { where("date >= ?", 30.days.ago).order(date: :desc) }
end
```

Add `has_many :anomalies` to User model.

**Step 3: Create AnomalyDetectionJob**

```ruby
# api/app/jobs/anomaly_detection_job.rb
class AnomalyDetectionJob < ApplicationJob
  queue_as :default

  METRICS = {
    sleep_score: { model: :oura_sleep_data, field: :sleep_score, direction: :low_is_bad },
    hrv: { model: :oura_readiness_data, field: :hrv_average, direction: :low_is_bad },
    resting_hr: { model: :oura_readiness_data, field: :resting_heart_rate, direction: :high_is_bad },
    steps: { model: :oura_activity_data, field: :steps, direction: :low_is_bad },
  }.freeze

  def perform
    User.find_each do |user|
      detect_anomalies(user)
    rescue StandardError => e
      Rails.logger.error("AnomalyDetection failed for user #{user.id}: #{e.message}")
    end
  end

  private

  def detect_anomalies(user)
    yesterday = Date.yesterday
    baseline_start = yesterday - 30.days

    METRICS.each do |metric_name, config|
      relation = user.send(config[:model])
      baseline = relation.where(date: baseline_start..yesterday - 1.day)

      values = baseline.pluck(config[:field]).compact.map(&:to_f)
      next if values.size < 7

      mean = values.sum / values.size
      std_dev = Math.sqrt(values.map { |v| (v - mean)**2 }.sum / values.size)
      next if std_dev.zero?

      today_record = relation.find_by(date: yesterday)
      next unless today_record

      value = today_record.send(config[:field]).to_f
      z_score = ((value - mean) / std_dev).round(2)

      # Flag if beyond 2 standard deviations in the "bad" direction
      anomalous = case config[:direction]
                  when :low_is_bad then z_score <= -2.0
                  when :high_is_bad then z_score >= 2.0
                  end

      next unless anomalous

      severity = z_score.abs >= 3.0 ? "critical" : "warning"
      message = build_message(metric_name, value, mean, z_score, config[:direction])

      user.anomalies.find_or_initialize_by(date: yesterday, metric: metric_name.to_s).update!(
        value: value,
        baseline_mean: mean.round(2),
        z_score: z_score,
        severity: severity,
        message: message
      )
    end

    # Cross-reference: find correlated anomalies on the same day
    yesterday_anomalies = user.anomalies.where(date: yesterday)
    if yesterday_anomalies.count >= 2
      names = yesterday_anomalies.pluck(:metric)
      yesterday_anomalies.each do |a|
        others = names - [a.metric]
        a.update(correlated_metric: others.first) if others.any?
      end
    end
  end

  def build_message(metric, value, mean, z_score, direction)
    metric_label = metric.to_s.tr('_', ' ')
    deviation = (direction == :low_is_bad) ? "below" : "above"
    "Your #{metric_label} (#{value.round(0)}) was #{z_score.abs} standard deviations #{deviation} your 30-day average (#{mean.round(0)})."
  end
end
```

Add to sidekiq.yml schedule:
```yaml
anomaly_detection:
  cron: "0 8 * * *"
  class: AnomalyDetectionJob
  queue: default
```

**Step 4: Create anomalies controller**

```ruby
# api/app/controllers/api/v1/anomalies_controller.rb
module Api
  module V1
    class AnomaliesController < BaseController
      def index
        anomalies = current_user.anomalies.active.recent
        render json: anomalies.map { |a|
          {
            id: a.id,
            date: a.date,
            metric: a.metric,
            value: a.value.to_f,
            baseline_mean: a.baseline_mean.to_f,
            z_score: a.z_score.to_f,
            severity: a.severity,
            message: a.message,
            correlated_metric: a.correlated_metric
          }
        }
      end

      def dismiss
        anomaly = current_user.anomalies.find(params[:id])
        anomaly.update!(dismissed_at: Time.current)
        head :no_content
      end
    end
  end
end
```

Add routes:
```ruby
resources :anomalies, only: [:index] do
  member do
    patch :dismiss
  end
end
```

**Step 5: Create AnomalyDrawer component**

```jsx
// web/src/components/AnomalyDrawer.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { format, parseISO } from 'date-fns';

const METRIC_COLORS = {
  sleep_score: 'text-indigo-400',
  hrv: 'text-cyan-400',
  resting_hr: 'text-red-400',
  steps: 'text-emerald-400',
  calories: 'text-amber-400',
  protein: 'text-cyan-400',
};

export default function AnomalyDrawer({ isOpen, onClose }) {
  const qc = useQueryClient();
  const { data: anomalies = [] } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => api.get('/anomalies'),
    staleTime: 1000 * 60 * 10,
  });

  const dismiss = useMutation({
    mutationFn: (id) => api.patch(`/anomalies/${id}/dismiss`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anomalies'] }),
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-dark-800 border-l border-dark-600/40 p-5 overflow-y-auto"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-200">Anomalies</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {anomalies.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">No anomalies detected. Looking good!</p>
            ) : (
              <div className="space-y-3">
                {anomalies.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`rounded-xl p-3 space-y-1.5 border ${
                      a.severity === 'critical'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-amber-500/10 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium uppercase ${METRIC_COLORS[a.metric] || 'text-gray-400'}`}>
                        {a.metric.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-500">{format(parseISO(a.date), 'MMM d')}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{a.message}</p>
                    {a.correlated_metric && (
                      <p className="text-[10px] text-gray-500">
                        Also anomalous: {a.correlated_metric.replace('_', ' ')}
                      </p>
                    )}
                    <button
                      onClick={() => dismiss.mutate(a.id)}
                      className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export a hook for the badge count
export function useAnomalyCount() {
  const { data = [] } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => api.get('/anomalies'),
    staleTime: 1000 * 60 * 10,
  });
  return data.length;
}
```

**Step 6: Wire into Layout**

In Layout.jsx, import `AnomalyDrawer` and `useAnomalyCount`. Add state `const [anomalyOpen, setAnomalyOpen] = useState(false)`. Replace the bell icon button in the header with one that shows a red dot badge when count > 0 and opens the drawer on click.

**Step 7: Commit**
