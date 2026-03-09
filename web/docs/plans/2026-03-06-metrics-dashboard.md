# Metrics Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dedicated `/metrics` page with 12 charts across 4 sections (Training, Recovery, Nutrition, Activity) showing fitness analytics over configurable time ranges.

**Architecture:** Single backend endpoint (`GET /api/v1/metrics?range=7d|30d|90d`) returns all chart data. Frontend renders a scrollable page with sticky time-range tabs and 4 card-based chart sections using Recharts (already installed). Follows existing dark theme and component patterns.

**Tech Stack:** Rails 7.2 API, React 19, Recharts v3, Framer Motion, TanStack Query, date-fns, Tailwind CSS v4

---

### Task 1: Backend Metrics Controller + Route

Build the API endpoint that returns all chart data in a single response.

**Files:**
- Create: `api/app/controllers/api/v1/metrics_controller.rb`
- Modify: `api/config/routes.rb`

**Step 1: Create the metrics controller**

```ruby
# api/app/controllers/api/v1/metrics_controller.rb
module Api
  module V1
    class MetricsController < BaseController
      def index
        range = parse_range(params[:range] || "30d")
        start_date = range.ago.to_date
        end_date = Date.current

        render json: {
          training: training_data(start_date, end_date),
          recovery: recovery_data(start_date, end_date),
          nutrition: nutrition_data(start_date, end_date),
          activity: activity_data(start_date, end_date),
          user: { body_weight_lbs: current_user.body_weight_lbs }
        }
      end

      private

      def parse_range(range_str)
        case range_str
        when "7d" then 7.days
        when "30d" then 30.days
        when "90d" then 90.days
        else 30.days
        end
      end

      def training_data(start_date, end_date)
        sessions = current_user.workout_sessions.completed
          .where(started_at: start_date.beginning_of_day..end_date.end_of_day)
          .includes(session_sets: :exercise)

        session_summaries = sessions.map do |s|
          working = s.session_sets.working_sets
          {
            date: s.started_at.to_date,
            volume: working.sum { |set| set.weight_lbs * set.reps },
            duration_minutes: s.completed_at && s.started_at ? ((s.completed_at - s.started_at) / 60).round : nil,
            muscle_groups: working.map { |set| set.exercise.muscle_group }.compact.uniq
          }
        end

        # Per-exercise history
        all_sets = sessions.flat_map { |s| s.session_sets.working_sets }
        exercises_used = all_sets.map { |s| s.exercise.name }.uniq.sort

        exercise_history = {}
        exercises_used.each do |name|
          ex_sets = all_sets.select { |s| s.exercise.name == name }
          by_date = ex_sets.group_by { |s| s.workout_session.started_at.to_date }

          exercise_history[name] = by_date.map do |date, sets|
            max_w = sets.map(&:weight_lbs).max
            max_reps_at_max = sets.select { |s| s.weight_lbs == max_w }.map(&:reps).max
            # Epley 1RM estimate
            estimated_1rm = max_reps_at_max == 1 ? max_w : (max_w * (1 + max_reps_at_max / 30.0)).round(1)
            {
              date: date,
              max_weight: max_w,
              max_reps: max_reps_at_max,
              estimated_1rm: estimated_1rm,
              volume: sets.sum { |s| s.weight_lbs * s.reps },
              sets: sets.size
            }
          end.sort_by { |d| d[:date] }
        end

        {
          sessions: session_summaries.sort_by { |s| s[:date] },
          exercise_history: exercise_history,
          exercises: exercises_used
        }
      end

      def recovery_data(start_date, end_date)
        sleep = current_user.oura_sleep_data
          .where(date: start_date..end_date)
          .order(:date)
          .map do |s|
            {
              date: s.date,
              sleep_score: s.sleep_score,
              total_minutes: s.total_sleep_minutes,
              deep_minutes: s.deep_sleep_minutes,
              rem_minutes: s.rem_sleep_minutes,
              light_minutes: s.light_sleep_minutes,
              awake_minutes: s.awake_minutes,
              efficiency: s.efficiency&.to_f
            }
          end

        readiness = current_user.oura_readiness_data
          .where(date: start_date..end_date)
          .order(:date)
          .map do |r|
            {
              date: r.date,
              readiness_score: r.readiness_score,
              hrv_average: r.hrv_average&.to_f,
              resting_heart_rate: r.resting_heart_rate,
              body_temperature_delta: r.body_temperature_delta&.to_f
            }
          end

        { sleep: sleep, readiness: readiness }
      end

      def nutrition_data(start_date, end_date)
        entries = current_user.nutrition_entries.where(date: start_date..end_date)
        daily = entries.group(:date).select(
          "date",
          "SUM(calories) as calories",
          "SUM(protein_g) as protein_g",
          "SUM(carbs_g) as carbs_g",
          "SUM(fat_g) as fat_g"
        ).order(:date).map do |row|
          {
            date: row.date,
            calories: row.calories.to_f.round(0),
            protein_g: row.protein_g.to_f.round(1),
            carbs_g: row.carbs_g.to_f.round(1),
            fat_g: row.fat_g.to_f.round(1)
          }
        end

        targets = {
          calories: current_user.daily_calorie_target || 2400,
          protein_g: current_user.daily_protein_target || 180
        }

        { daily: daily, targets: targets }
      end

      def activity_data(start_date, end_date)
        daily = current_user.oura_activity_data
          .where(date: start_date..end_date)
          .order(:date)
          .map do |a|
            {
              date: a.date,
              steps: a.steps,
              active_calories: a.active_calories,
              total_calories: a.total_calories,
              active_minutes: a.active_minutes
            }
          end

        { daily: daily }
      end
    end
  end
end
```

**Step 2: Add the route**

In `api/config/routes.rb`, inside the `namespace :v1` block, add:

```ruby
get "metrics", to: "metrics#index"
```

**Step 3: Test the endpoint**

Run: `curl http://localhost:3000/api/v1/metrics?range=30d | python3 -m json.tool | head -40`

Expected: JSON response with `training`, `recovery`, `nutrition`, `activity`, `user` keys.

**Step 4: Commit**

```bash
git add api/app/controllers/api/v1/metrics_controller.rb api/config/routes.rb
git commit -m "feat: add metrics API endpoint"
```

---

### Task 2: Frontend Hook + Nav Icon + Route

Wire up the frontend: new API hook, add nav icon, add route to App.jsx.

**Files:**
- Modify: `web/src/api/hooks.js`
- Modify: `web/src/App.jsx`
- Modify: `web/src/components/Layout.jsx`
- Create: `web/src/pages/Metrics.jsx` (placeholder)

**Step 1: Add the useMetrics hook**

In `web/src/api/hooks.js`, add near the bottom (after the daily reports hooks):

```js
// ─── Metrics ────────────────────────────────────────────────
export function useMetrics(range = '30d') {
  return useQuery({
    queryKey: ['metrics', range],
    queryFn: () => api.get('/metrics', { range }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

**Step 2: Create placeholder Metrics page**

```jsx
// web/src/pages/Metrics.jsx
export default function Metrics() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-100">Metrics</h1>
      <p className="text-gray-400 text-sm">Charts coming soon...</p>
    </div>
  );
}
```

**Step 3: Add route to App.jsx**

In `web/src/App.jsx`, add import:
```js
import Metrics from './pages/Metrics';
```

Add route inside the protected routes `<Route>` block (after `/reports/:id`):
```jsx
<Route path="/metrics" element={<Metrics />} />
```

**Step 4: Add nav icon to Layout.jsx**

Add a PulseIcon component after the existing icon definitions (around line 75):

```jsx
const PulseIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 4 18 3-9h4" />
  </svg>
);
```

In the `navItems` array (line 79), add before the reports entry:
```js
{ to: '/metrics', Icon: PulseIcon },
```

In the mobile bottom nav section (hardcoded NavLinks around lines 385-407), add a new NavLink for Metrics before the Nutrition or Reports link. Keep the 5-tab layout by replacing the Reports tab with Metrics (Reports is accessible from the dashboard/sidebar):

Add between the Nutrition and Reports NavLinks:
```jsx
{/* Metrics */}
<NavLink
  to="/metrics"
  className={({ isActive }) =>
    `flex items-center justify-center w-12 h-12 transition-colors ${
      isActive ? 'text-cyan-400' : 'text-gray-500'
    }`
  }
>
  <PulseIcon className="w-6 h-6" />
</NavLink>
```

Note: The bottom nav now has 5 items (Home, Programs, Nutrition, Metrics, Reports) plus the FAB. You may need to adjust spacing. If it feels crowded, replace the Reports icon in the bottom nav with Metrics (keep Reports accessible via sidebar only).

**Step 5: Commit**

```bash
git add web/src/api/hooks.js web/src/pages/Metrics.jsx web/src/App.jsx web/src/components/Layout.jsx
git commit -m "feat: add metrics route, hook, and nav icon"
```

---

### Task 3: Metrics Page Shell + Time Range Tabs

Build the page structure with sticky time-range tabs and section headers.

**Files:**
- Modify: `web/src/pages/Metrics.jsx`

**Step 1: Implement the full page shell**

```jsx
// web/src/pages/Metrics.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMetrics } from '../api/hooks';
import Card from '../components/Card';

const RANGES = [
  { key: '7d', label: 'Week' },
  { key: '30d', label: 'Month' },
  { key: '90d', label: 'Quarter' },
];

function SectionHeader({ title }) {
  return (
    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-3 first:mt-0">
      {title}
    </h2>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card className="space-y-3">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
      {children}
    </Card>
  );
}

export default function Metrics() {
  const [range, setRange] = useState('30d');
  const { data, isLoading } = useMetrics(range);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header + Time Tabs */}
      <div className="flex items-center justify-between sticky top-14 z-20 bg-dark-900 py-3 -mx-5 px-5 lg:-mx-6 lg:px-6">
        <h1 className="text-xl font-bold text-gray-100">Metrics</h1>
        <div className="flex gap-1 bg-dark-800 rounded-lg p-1">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                range === key
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Training Section */}
      <SectionHeader title="Training" />
      <ChartCard title="Lift Progression">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>
      <ChartCard title="Volume Trend">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>
      <ChartCard title="Workout Frequency">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>

      {/* Recovery Section */}
      <SectionHeader title="Recovery" />
      <ChartCard title="Sleep Score & Duration">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>
      <ChartCard title="Sleep Stages">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>
      <ChartCard title="HRV Trend">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>
      <ChartCard title="Resting Heart Rate">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>

      {/* Nutrition Section */}
      <SectionHeader title="Nutrition" />
      <ChartCard title="Calories vs Target">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>
      <ChartCard title="Macro Breakdown">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>
      <ChartCard title="Protein per lb Bodyweight">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>

      {/* Activity Section */}
      <SectionHeader title="Activity" />
      <ChartCard title="Daily Steps">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>
      <ChartCard title="Active Calories">
        <p className="text-gray-600 text-xs">Chart placeholder</p>
      </ChartCard>
    </div>
  );
}
```

**Step 2: Verify it renders**

Run the dev server, navigate to `/metrics`. Should see the page title, time-range tabs, and 12 placeholder chart cards organized in 4 sections.

**Step 3: Commit**

```bash
git add web/src/pages/Metrics.jsx
git commit -m "feat: metrics page shell with time range tabs"
```

---

### Task 4: Training Charts (Lift Progression, Volume, Frequency)

Build the 3 training section charts.

**Files:**
- Create: `web/src/components/charts/LiftProgressionChart.jsx`
- Create: `web/src/components/charts/VolumeTrendChart.jsx`
- Create: `web/src/components/charts/WorkoutFrequencyDots.jsx`
- Modify: `web/src/pages/Metrics.jsx`

**Step 1: Create LiftProgressionChart**

```jsx
// web/src/components/charts/LiftProgressionChart.jsx
import { useState } from 'react';
import {
  ResponsiveContainer, ScatterChart, Scatter, Line, XAxis, YAxis, Tooltip, ReferenceDot
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-cyan-400 font-mono">{d.max_weight} lbs x {d.max_reps}</p>
      <p className="text-gray-500">Est. 1RM: {Math.round(d.estimated_1rm)} lbs</p>
    </div>
  );
}

export default function LiftProgressionChart({ exerciseHistory = {}, exercises = [] }) {
  const [selected, setSelected] = useState(exercises[0] || '');
  const data = (exerciseHistory[selected] || []).map(d => ({
    ...d,
    date: String(d.date),
    weight: d.max_weight,
  }));

  if (exercises.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No workout data yet</p>;
  }

  // Find PR (max weight)
  const prPoint = data.reduce((max, d) => d.weight > (max?.weight || 0) ? d : max, null);

  return (
    <div className="space-y-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
      >
        {exercises.map((ex) => (
          <option key={ex} value={ex}>{ex}</option>
        ))}
      </select>

      {data.length === 0 ? (
        <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No data for this exercise</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(d) => format(parseISO(d), 'M/d')}
            />
            <YAxis
              dataKey="weight"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={35}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#22d3ee" r={5} />
            {prPoint && (
              <ReferenceDot
                x={prPoint.date}
                y={prPoint.weight}
                r={8}
                fill="#fbbf24"
                stroke="#fbbf24"
                strokeWidth={2}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

**Step 2: Create VolumeTrendChart**

```jsx
// web/src/components/charts/VolumeTrendChart.jsx
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-cyan-400 font-mono">{d.volume.toLocaleString()} lbs</p>
      {d.duration_minutes && <p className="text-gray-500">{d.duration_minutes} min</p>}
    </div>
  );
}

export default function VolumeTrendChart({ sessions = [] }) {
  const data = sessions.map(s => ({ ...s, date: String(s.date) }));

  if (data.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No workout data yet</p>;
  }

  const avg = data.reduce((sum, d) => sum + d.volume, 0) / data.length;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="20%">
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={avg} stroke="#fbbf24" strokeDasharray="4 4" strokeOpacity={0.6} />
        <Bar dataKey="volume" fill="#22d3ee" radius={[3, 3, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Step 3: Create WorkoutFrequencyDots**

```jsx
// web/src/components/charts/WorkoutFrequencyDots.jsx
import { eachDayOfInterval, parseISO, format, isValid } from 'date-fns';

export default function WorkoutFrequencyDots({ sessions = [], range = '30d' }) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);

  const allDays = eachDayOfInterval({ start, end });

  const workoutDates = new Set(
    sessions.map(s => {
      const d = typeof s.date === 'string' ? parseISO(s.date) : s.date;
      return isValid(d) ? format(d, 'yyyy-MM-dd') : null;
    }).filter(Boolean)
  );

  const trained = allDays.filter(d => workoutDates.has(format(d, 'yyyy-MM-dd'))).length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {allDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const didTrain = workoutDates.has(key);
          return (
            <div
              key={key}
              title={`${format(day, 'MMM d')}${didTrain ? ' - trained' : ''}`}
              className={`w-3 h-3 rounded-full transition-colors ${
                didTrain
                  ? 'bg-cyan-400 shadow-sm shadow-cyan-400/30'
                  : 'bg-dark-600'
              }`}
            />
          );
        })}
      </div>
      <p className="text-xs text-gray-500 font-mono">
        {trained}/{allDays.length} days trained
      </p>
    </div>
  );
}
```

**Step 4: Wire into Metrics.jsx**

Add imports to `Metrics.jsx`:
```jsx
import LiftProgressionChart from '../components/charts/LiftProgressionChart';
import VolumeTrendChart from '../components/charts/VolumeTrendChart';
import WorkoutFrequencyDots from '../components/charts/WorkoutFrequencyDots';
```

Replace the Training section placeholders:
```jsx
{/* Training Section */}
<SectionHeader title="Training" />
<ChartCard title="Lift Progression">
  <LiftProgressionChart
    exerciseHistory={data?.training?.exercise_history}
    exercises={data?.training?.exercises}
  />
</ChartCard>
<ChartCard title="Volume Trend">
  <VolumeTrendChart sessions={data?.training?.sessions} />
</ChartCard>
<ChartCard title="Workout Frequency">
  <WorkoutFrequencyDots sessions={data?.training?.sessions} range={range} />
</ChartCard>
```

**Step 5: Commit**

```bash
git add web/src/components/charts/LiftProgressionChart.jsx web/src/components/charts/VolumeTrendChart.jsx web/src/components/charts/WorkoutFrequencyDots.jsx web/src/pages/Metrics.jsx
git commit -m "feat: training section charts (lift progression, volume, frequency)"
```

---

### Task 5: Recovery Charts (Sleep, HRV, Resting HR)

Build the 4 recovery section charts.

**Files:**
- Create: `web/src/components/charts/SleepScoreChart.jsx`
- Create: `web/src/components/charts/SleepStagesChart.jsx`
- Create: `web/src/components/charts/HRVTrendChart.jsx`
- Create: `web/src/components/charts/RestingHRChart.jsx`
- Modify: `web/src/pages/Metrics.jsx`

**Step 1: Create SleepScoreChart**

```jsx
// web/src/components/charts/SleepScoreChart.jsx
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const hrs = Math.floor(d.total_minutes / 60);
  const mins = d.total_minutes % 60;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-cyan-400 font-mono">Score: {d.sleep_score}</p>
      <p className="text-gray-400">{hrs}h {mins}m total</p>
    </div>
  );
}

export default function SleepScoreChart({ data = [] }) {
  const chartData = data.map(d => ({
    ...d,
    date: String(d.date),
    hours: d.total_minutes ? +(d.total_minutes / 60).toFixed(1) : 0,
  }));

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No sleep data — connect Oura Ring</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')} />
        <YAxis yAxisId="score" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          width={30} domain={[0, 100]} />
        <YAxis yAxisId="hours" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false}
          tickLine={false} width={30} domain={[0, 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <Area yAxisId="hours" type="monotone" dataKey="hours" fill="#22d3ee" fillOpacity={0.08}
          stroke="none" />
        <Line yAxisId="score" type="monotone" dataKey="sleep_score" stroke="#22d3ee" strokeWidth={2}
          dot={{ fill: '#22d3ee', r: 2 }} animationDuration={800} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

**Step 2: Create SleepStagesChart**

```jsx
// web/src/components/charts/SleepStagesChart.jsx
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium mb-1">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-indigo-400">Deep: {d.deep_minutes}m</p>
      <p className="text-purple-400">REM: {d.rem_minutes}m</p>
      <p className="text-slate-400">Light: {d.light_minutes}m</p>
      <p className="text-red-400/70">Awake: {d.awake_minutes}m</p>
    </div>
  );
}

export default function SleepStagesChart({ data = [] }) {
  const chartData = data.map(d => ({ ...d, date: String(d.date) }));

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No sleep data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35}
          tickFormatter={(v) => `${Math.round(v / 60)}h`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="deep_minutes" stackId="1" fill="#6366f1" fillOpacity={0.7} stroke="none" />
        <Area type="monotone" dataKey="rem_minutes" stackId="1" fill="#a855f7" fillOpacity={0.6} stroke="none" />
        <Area type="monotone" dataKey="light_minutes" stackId="1" fill="#64748b" fillOpacity={0.4} stroke="none" />
        <Area type="monotone" dataKey="awake_minutes" stackId="1" fill="#f87171" fillOpacity={0.3} stroke="none" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

**Step 3: Create HRVTrendChart**

```jsx
// web/src/components/charts/HRVTrendChart.jsx
import { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-cyan-400 font-mono">HRV: {d.hrv_average?.toFixed(0)} ms</p>
      {d.avg7 && <p className="text-gray-500">7d avg: {d.avg7.toFixed(0)} ms</p>}
    </div>
  );
}

export default function HRVTrendChart({ data = [] }) {
  const chartData = useMemo(() => {
    const values = data.map(d => d.hrv_average).filter(Boolean);
    const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length || 1));

    return data.map((d, i) => {
      // 7-day rolling average
      const window = data.slice(Math.max(0, i - 6), i + 1);
      const avg7 = window.reduce((s, w) => s + (w.hrv_average || 0), 0) / window.length;

      return {
        ...d,
        date: String(d.date),
        avg7: avg7 || null,
        upperBand: mean + stdDev,
        lowerBand: Math.max(0, mean - stdDev),
      };
    });
  }, [data]);

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No HRV data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30}
          domain={['dataMin - 5', 'dataMax + 5']} />
        <Tooltip content={<CustomTooltip />} />
        {/* Standard deviation band */}
        <Area type="monotone" dataKey="upperBand" fill="#22d3ee" fillOpacity={0.06} stroke="none" />
        <Area type="monotone" dataKey="lowerBand" fill="#0a0a0f" fillOpacity={1} stroke="none" />
        {/* 7-day rolling average */}
        <Line type="monotone" dataKey="avg7" stroke="#6b7280" strokeWidth={1} strokeDasharray="4 4" dot={false} />
        {/* Daily HRV */}
        <Line type="monotone" dataKey="hrv_average" stroke="#22d3ee" strokeWidth={2}
          dot={{ fill: '#22d3ee', r: 2.5 }} animationDuration={800} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

**Step 4: Create RestingHRChart**

```jsx
// web/src/components/charts/RestingHRChart.jsx
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-emerald-400 font-mono">{d.resting_heart_rate} bpm</p>
    </div>
  );
}

export default function RestingHRChart({ data = [] }) {
  const chartData = data.filter(d => d.resting_heart_rate).map(d => ({
    ...d,
    date: String(d.date),
  }));

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No heart rate data</p>;
  }

  // Color based on trend: is it going down (good) or up (bad)?
  const first = chartData[0]?.resting_heart_rate || 60;
  const last = chartData[chartData.length - 1]?.resting_heart_rate || 60;
  const color = last <= first ? '#34d399' : '#f87171';

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30}
          domain={['dataMin - 2', 'dataMax + 2']} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="resting_heart_rate" stroke={color} strokeWidth={2}
          dot={{ fill: color, r: 2 }} animationDuration={800} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Step 5: Wire into Metrics.jsx**

Add imports:
```jsx
import SleepScoreChart from '../components/charts/SleepScoreChart';
import SleepStagesChart from '../components/charts/SleepStagesChart';
import HRVTrendChart from '../components/charts/HRVTrendChart';
import RestingHRChart from '../components/charts/RestingHRChart';
```

Replace Recovery section placeholders:
```jsx
<SectionHeader title="Recovery" />
<ChartCard title="Sleep Score & Duration">
  <SleepScoreChart data={data?.recovery?.sleep} />
</ChartCard>
<ChartCard title="Sleep Stages">
  <SleepStagesChart data={data?.recovery?.sleep} />
</ChartCard>
<ChartCard title="HRV Trend">
  <HRVTrendChart data={data?.recovery?.readiness} />
</ChartCard>
<ChartCard title="Resting Heart Rate">
  <RestingHRChart data={data?.recovery?.readiness} />
</ChartCard>
```

**Step 6: Commit**

```bash
git add web/src/components/charts/SleepScoreChart.jsx web/src/components/charts/SleepStagesChart.jsx web/src/components/charts/HRVTrendChart.jsx web/src/components/charts/RestingHRChart.jsx web/src/pages/Metrics.jsx
git commit -m "feat: recovery section charts (sleep, HRV, resting HR)"
```

---

### Task 6: Nutrition Charts (Calories, Macros, Protein/lb)

Build the 3 nutrition section charts.

**Files:**
- Create: `web/src/components/charts/CaloriesVsTargetChart.jsx`
- Create: `web/src/components/charts/MacroTrendChart.jsx`
- Create: `web/src/components/charts/ProteinPerLbChart.jsx`
- Modify: `web/src/pages/Metrics.jsx`

**Step 1: Create CaloriesVsTargetChart**

```jsx
// web/src/components/charts/CaloriesVsTargetChart.jsx
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-cyan-400 font-mono">{Math.round(d.calories)} cal</p>
      <p className="text-gray-500">Target: {d.target}</p>
    </div>
  );
}

export default function CaloriesVsTargetChart({ data = [], target = 2400 }) {
  const chartData = data.map(d => ({ ...d, date: String(d.date), target }));

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No nutrition data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} barCategoryGap="15%">
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={target} stroke="#fbbf24" strokeDasharray="4 4" strokeOpacity={0.6} />
        <Bar dataKey="calories" radius={[3, 3, 0, 0]} animationDuration={800}>
          {chartData.map((entry, i) => {
            const diff = Math.abs(entry.calories - target);
            const fill = diff <= 100 ? '#34d399' : diff <= 300 ? '#22d3ee' : entry.calories > target ? '#f87171' : '#fbbf24';
            return <Cell key={i} fill={fill} fillOpacity={0.8} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Step 2: Create MacroTrendChart**

```jsx
// web/src/components/charts/MacroTrendChart.jsx
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium mb-1">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-cyan-400">Protein: {Math.round(d.protein_g)}g</p>
      <p className="text-amber-400">Carbs: {Math.round(d.carbs_g)}g</p>
      <p className="text-emerald-400">Fat: {Math.round(d.fat_g)}g</p>
    </div>
  );
}

export default function MacroTrendChart({ data = [] }) {
  const chartData = data.map(d => ({ ...d, date: String(d.date) }));

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No nutrition data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30}
          tickFormatter={(v) => `${v}g`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="protein_g" stackId="1" fill="#22d3ee" fillOpacity={0.6} stroke="#22d3ee" strokeWidth={1} />
        <Area type="monotone" dataKey="carbs_g" stackId="1" fill="#fbbf24" fillOpacity={0.4} stroke="#fbbf24" strokeWidth={1} />
        <Area type="monotone" dataKey="fat_g" stackId="1" fill="#34d399" fillOpacity={0.4} stroke="#34d399" strokeWidth={1} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

**Step 3: Create ProteinPerLbChart**

```jsx
// web/src/components/charts/ProteinPerLbChart.jsx
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ReferenceArea
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-cyan-400 font-mono">{d.proteinPerLb.toFixed(2)} g/lb</p>
      <p className="text-gray-500">{Math.round(d.protein_g)}g protein @ {d.bodyWeight} lbs</p>
    </div>
  );
}

export default function ProteinPerLbChart({ data = [], bodyWeight = 185 }) {
  const chartData = data
    .filter(d => d.protein_g > 0)
    .map(d => ({
      ...d,
      date: String(d.date),
      proteinPerLb: +(d.protein_g / bodyWeight).toFixed(3),
      bodyWeight,
    }));

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No nutrition data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35}
          domain={[0, 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        {/* Target zone band: 0.8 - 1.2 g/lb */}
        <ReferenceArea y1={0.8} y2={1.2} fill="#34d399" fillOpacity={0.08} />
        <Line type="monotone" dataKey="proteinPerLb" stroke="#22d3ee" strokeWidth={2}
          dot={{ fill: '#22d3ee', r: 2.5 }} animationDuration={800} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

**Step 4: Wire into Metrics.jsx**

Add imports:
```jsx
import CaloriesVsTargetChart from '../components/charts/CaloriesVsTargetChart';
import MacroTrendChart from '../components/charts/MacroTrendChart';
import ProteinPerLbChart from '../components/charts/ProteinPerLbChart';
```

Replace Nutrition section placeholders:
```jsx
<SectionHeader title="Nutrition" />
<ChartCard title="Calories vs Target">
  <CaloriesVsTargetChart data={data?.nutrition?.daily} target={data?.nutrition?.targets?.calories} />
</ChartCard>
<ChartCard title="Macro Breakdown">
  <MacroTrendChart data={data?.nutrition?.daily} />
</ChartCard>
<ChartCard title="Protein per lb Bodyweight">
  <ProteinPerLbChart data={data?.nutrition?.daily} bodyWeight={data?.user?.body_weight_lbs} />
</ChartCard>
```

**Step 5: Commit**

```bash
git add web/src/components/charts/CaloriesVsTargetChart.jsx web/src/components/charts/MacroTrendChart.jsx web/src/components/charts/ProteinPerLbChart.jsx web/src/pages/Metrics.jsx
git commit -m "feat: nutrition section charts (calories, macros, protein/lb)"
```

---

### Task 7: Activity Charts (Steps, Active Calories)

Build the 2 activity section charts.

**Files:**
- Create: `web/src/components/charts/StepsChart.jsx`
- Create: `web/src/components/charts/ActiveCaloriesChart.jsx`
- Modify: `web/src/pages/Metrics.jsx`

**Step 1: Create StepsChart**

```jsx
// web/src/components/charts/StepsChart.jsx
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-cyan-400 font-mono">{d.steps?.toLocaleString()} steps</p>
    </div>
  );
}

export default function StepsChart({ data = [] }) {
  const chartData = data.map(d => ({ ...d, date: String(d.date) }));

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No activity data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} barCategoryGap="15%">
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={10000} stroke="#34d399" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: '10k', fill: '#34d399', fontSize: 10, position: 'right' }} />
        <ReferenceLine y={8000} stroke="#fbbf24" strokeDasharray="4 4" strokeOpacity={0.3} />
        <Bar dataKey="steps" radius={[3, 3, 0, 0]} animationDuration={800}>
          {chartData.map((entry, i) => {
            const fill = entry.steps >= 10000 ? '#34d399' : entry.steps >= 8000 ? '#22d3ee' : '#6b7280';
            return <Cell key={i} fill={fill} fillOpacity={0.7} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Step 2: Create ActiveCaloriesChart**

```jsx
// web/src/components/charts/ActiveCaloriesChart.jsx
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';
import { format, parseISO } from 'date-fns';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium">{format(parseISO(d.date), 'MMM d')}</p>
      <p className="text-cyan-400 font-mono">{d.active_calories} active cal</p>
    </div>
  );
}

export default function ActiveCaloriesChart({ data = [] }) {
  const chartData = data.map(d => ({ ...d, date: String(d.date) }));

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No activity data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="activeCalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={(d) => format(parseISO(d), 'M/d')} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="active_calories" stroke="#22d3ee" strokeWidth={2}
          fill="url(#activeCalGrad)" animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

**Step 3: Wire into Metrics.jsx**

Add imports:
```jsx
import StepsChart from '../components/charts/StepsChart';
import ActiveCaloriesChart from '../components/charts/ActiveCaloriesChart';
```

Replace Activity section placeholders:
```jsx
<SectionHeader title="Activity" />
<ChartCard title="Daily Steps">
  <StepsChart data={data?.activity?.daily} />
</ChartCard>
<ChartCard title="Active Calories">
  <ActiveCaloriesChart data={data?.activity?.daily} />
</ChartCard>
```

**Step 4: Verify everything renders**

Navigate to `/metrics`. All 12 charts should render with data (or show appropriate empty states if no data). Toggle between Week, Month, Quarter tabs — each should trigger a new API call and re-render.

**Step 5: Commit**

```bash
git add web/src/components/charts/StepsChart.jsx web/src/components/charts/ActiveCaloriesChart.jsx web/src/pages/Metrics.jsx
git commit -m "feat: activity section charts (steps, active calories)"
```
