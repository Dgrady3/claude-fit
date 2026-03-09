# Weekly AI Health Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate a weekly AI body composition analysis that compares this week vs last week across workouts, nutrition, and Oura data, with actionable recommendations for muscle gain / fat loss goals.

**Architecture:** A `WeeklyAnalysisService` gathers 2 weeks of data, builds a body-comp-focused prompt, and sends it to Claude. Results are stored in the existing `daily_reports` table via a new `report_type` column. A `WeeklyAnalysisJob` runs every Sunday at 10 PM via sidekiq-scheduler.

**Tech Stack:** Rails 7.2, PostgreSQL (JSONB), Sidekiq + sidekiq-scheduler, Claude API (anthropic-sdk-beta gem), existing ClaudeClient wrapper

---

### Task 1: Add report_type column to daily_reports

**Files:**
- Create: `db/migrate/TIMESTAMP_add_report_type_to_daily_reports.rb`
- Modify: `app/models/daily_report.rb`

**Step 1: Generate migration**

Run:
```bash
cd /Users/joegrady/Development/projects/grokfit/api
bin/rails generate migration AddReportTypeToDailyReports report_type:string
```

**Step 2: Edit the generated migration to add default and index**

Replace the migration content with:

```ruby
class AddReportTypeToDailyReports < ActiveRecord::Migration[7.2]
  def change
    add_column :daily_reports, :report_type, :string, default: "daily", null: false

    # Remove old unique index on [user_id, date] — weekly reports share the same date range
    remove_index :daily_reports, [:user_id, :date]

    # New unique index on [user_id, date, report_type]
    add_index :daily_reports, [:user_id, :date, :report_type], unique: true
  end
end
```

**Step 3: Run migration**

Run:
```bash
bin/rails db:migrate
```
Expected: Migration runs successfully, `report_type` column added.

**Step 4: Update DailyReport model**

Modify `app/models/daily_report.rb`:

```ruby
class DailyReport < ApplicationRecord
  belongs_to :user

  validates :date, uniqueness: { scope: [:user_id, :report_type] }
  validates :report_type, inclusion: { in: %w[daily weekly] }

  scope :recent, -> { order(date: :desc).limit(30) }
  scope :daily, -> { where(report_type: "daily") }
  scope :weekly, -> { where(report_type: "weekly") }
end
```

**Step 5: Verify**

Run:
```bash
bin/rails console -e development
DailyReport.column_names.include?("report_type")
# => true
```

**Step 6: Commit**

```bash
git add db/migrate/*add_report_type* app/models/daily_report.rb db/schema.rb
git commit -m "feat: add report_type column to daily_reports for weekly reports"
```

---

### Task 2: Create WeeklyAnalysisService

**Files:**
- Create: `app/services/weekly_analysis_service.rb`

**Context:** Follow the same pattern as `app/services/daily_analysis_service.rb`. The service gathers 2 weeks of data, builds a body-composition-focused prompt, calls Claude via `ClaudeClient`, parses the JSON response, and stores it in `daily_reports` with `report_type: "weekly"`.

**Step 1: Create the service**

Create `app/services/weekly_analysis_service.rb`:

```ruby
class WeeklyAnalysisService
  def call(user, week_ending = Date.current)
    # Week = Monday through Sunday
    week_end = week_ending
    week_start = week_end - 6.days
    prev_week_end = week_start - 1.day
    prev_week_start = prev_week_end - 6.days

    this_week = gather_week_data(user, week_start, week_end)
    last_week = gather_week_data(user, prev_week_start, prev_week_end)

    data = {
      this_week: this_week,
      last_week: last_week,
      goals: user.user_goals.as_json,
      user_profile: {
        weight: user.body_weight_lbs,
        height: user.height_inches,
        age: user.age,
        sex: user.sex
      }
    }

    response = ClaudeClient.new.chat(
      system: system_prompt(user),
      messages: [{ role: "user", content: build_prompt(data, week_start, week_end) }],
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096
    )

    parsed = parse_response(response[:content])

    report = user.daily_reports.find_or_initialize_by(date: week_end, report_type: "weekly")
    report.update!(
      analysis_text: parsed[:analysis],
      recommendations: parsed[:recommendations] || [],
      scores: parsed[:scores] || {},
      raw_data_snapshot: data,
      model_used: response[:model],
      prompt_tokens: response[:prompt_tokens],
      completion_tokens: response[:completion_tokens]
    )

    report
  end

  private

  def gather_week_data(user, start_date, end_date)
    sessions = user.workout_sessions.completed
      .where(started_at: start_date.beginning_of_day..end_date.end_of_day)
      .includes(session_sets: :exercise)

    {
      workouts: workout_summary(sessions),
      nutrition: nutrition_summary(user, start_date, end_date),
      sleep: sleep_summary(user, start_date, end_date),
      readiness: readiness_summary(user, start_date, end_date),
      activity: activity_summary(user, start_date, end_date)
    }
  end

  def workout_summary(sessions)
    sets = sessions.flat_map { |s| s.session_sets.working_sets }

    volume_by_muscle = sets.group_by { |s| s.exercise.muscle_group }.transform_values do |group_sets|
      {
        total_volume: group_sets.sum { |s| s.weight_lbs * s.reps },
        total_sets: group_sets.size,
        exercises: group_sets.map { |s| s.exercise.name }.uniq
      }
    end

    # Progressive overload: track max weight per exercise
    max_weights = sets.group_by { |s| s.exercise.name }.transform_values do |ex_sets|
      {
        max_weight: ex_sets.map(&:weight_lbs).max,
        max_reps_at_max_weight: ex_sets.select { |s| s.weight_lbs == ex_sets.map(&:weight_lbs).max }.map(&:reps).max
      }
    end

    {
      session_count: sessions.size,
      total_volume: sets.sum { |s| s.weight_lbs * s.reps },
      volume_by_muscle_group: volume_by_muscle,
      max_weights_per_exercise: max_weights
    }
  end

  def nutrition_summary(user, start_date, end_date)
    entries = user.nutrition_entries.where(date: start_date..end_date)
    days_with_data = entries.select(:date).distinct.count.clamp(1, 7)

    {
      days_tracked: days_with_data,
      avg_calories: (entries.sum(:calories).to_f / days_with_data).round(0),
      avg_protein: (entries.sum(:protein_g).to_f / days_with_data).round(1),
      avg_carbs: (entries.sum(:carbs_g).to_f / days_with_data).round(1),
      avg_fat: (entries.sum(:fat_g).to_f / days_with_data).round(1)
    }
  end

  def sleep_summary(user, start_date, end_date)
    data = user.oura_sleep_data.where(date: start_date..end_date)
    count = data.count
    return nil if count == 0

    {
      nights_tracked: count,
      avg_score: (data.average(:sleep_score)&.round(1)),
      avg_total_minutes: (data.average(:total_sleep_minutes)&.round(0)),
      avg_deep_minutes: (data.average(:deep_sleep_minutes)&.round(0)),
      avg_rem_minutes: (data.average(:rem_sleep_minutes)&.round(0))
    }
  end

  def readiness_summary(user, start_date, end_date)
    data = user.oura_readiness_data.where(date: start_date..end_date)
    count = data.count
    return nil if count == 0

    {
      days_tracked: count,
      avg_readiness: (data.average(:readiness_score)&.round(1)),
      avg_hrv: (data.average(:hrv_average)&.round(1)),
      avg_resting_hr: (data.average(:resting_heart_rate)&.round(1))
    }
  end

  def activity_summary(user, start_date, end_date)
    data = user.oura_activity_data.where(date: start_date..end_date)
    count = data.count
    return nil if count == 0

    {
      days_tracked: count,
      avg_steps: (data.average(:steps)&.round(0)),
      avg_active_calories: (data.average(:active_calories)&.round(0))
    }
  end

  def system_prompt(user)
    <<~PROMPT
      You are GrokFit, an expert body composition coach and health analyst. You provide weekly analysis reports focused on helping users build muscle and lose body fat.

      User Profile:
      - Name: #{user.name || "User"}
      - Age: #{user.age || "Unknown"}
      - Sex: #{user.sex || "Unknown"}
      - Current Weight: #{user.body_weight_lbs || "Unknown"} lbs
      - Height: #{user.height_inches || "Unknown"} inches

      Your analysis should focus on body composition — the interplay between nutrition, training, and recovery that determines whether someone gains muscle, loses fat, or both.

      Key principles you follow:
      - Muscle gain requires adequate protein (0.7-1g per lb bodyweight) and progressive overload
      - Fat loss requires a caloric deficit while maintaining protein and training intensity
      - Sleep and recovery (HRV, readiness) directly impact muscle protein synthesis and hormone regulation
      - Consistency matters more than perfection
      - Week-over-week trends matter more than any single day

      Scoring Rules:
      - Rate each category (nutrition, sleep, recovery, training) on a 1-10 scale
      - Provide an overall weekly score (1-100)
      - Be honest — if data is missing or insufficient, say so rather than guessing

      IMPORTANT: Respond ONLY with valid JSON in this exact format:
      {
        "analysis": "Your detailed weekly analysis here (2-3 paragraphs covering key trends and observations)",
        "scores": {
          "overall": 75,
          "nutrition": 7,
          "sleep": 8,
          "recovery": 6,
          "training": 7
        },
        "recommendations": [
          "Specific, actionable recommendation for next week",
          "Another specific recommendation",
          "Third recommendation"
        ]
      }
    PROMPT
  end

  def build_prompt(data, week_start, week_end)
    <<~PROMPT
      Generate my weekly body composition analysis for the week of #{week_start.strftime("%B %d")} - #{week_end.strftime("%B %d, %Y")}.

      THIS WEEK'S DATA:
      #{JSON.pretty_generate(data[:this_week])}

      LAST WEEK'S DATA (for comparison):
      #{JSON.pretty_generate(data[:last_week])}

      MY GOALS:
      #{JSON.pretty_generate(data[:goals])}

      Analyze:
      1. Am I on track for my body composition goals (muscle gain / fat loss)?
      2. How does this week compare to last week — what improved, what regressed?
      3. Is my protein intake adequate for muscle growth?
      4. Is my caloric intake aligned with my goals?
      5. Is my training volume and progressive overload trending in the right direction?
      6. Are my sleep and recovery metrics supporting my training?
      7. Give me 3-5 specific things to adjust next week.
    PROMPT
  end

  def parse_response(content)
    json = JSON.parse(content, symbolize_names: true)
    {
      analysis: json[:analysis],
      scores: json[:scores],
      recommendations: json[:recommendations]
    }
  rescue JSON::ParserError
    {
      analysis: content,
      scores: {},
      recommendations: []
    }
  end
end
```

**Step 2: Verify it loads**

Run:
```bash
bin/rails console -e development
WeeklyAnalysisService.new
# => #<WeeklyAnalysisService:...>
```

**Step 3: Commit**

```bash
git add app/services/weekly_analysis_service.rb
git commit -m "feat: add WeeklyAnalysisService for body comp analysis"
```

---

### Task 3: Create WeeklyAnalysisJob and schedule it

**Files:**
- Create: `app/jobs/weekly_analysis_job.rb`
- Modify: `config/sidekiq.yml`

**Step 1: Create the job**

Create `app/jobs/weekly_analysis_job.rb`:

```ruby
class WeeklyAnalysisJob < ApplicationJob
  queue_as :default

  def perform
    User.find_each do |user|
      WeeklyAnalysisService.new.call(user, Date.current)
    rescue StandardError => e
      Rails.logger.error("WeeklyAnalysisJob failed for user #{user.id}: #{e.message}")
    end
  end
end
```

**Step 2: Add schedule to sidekiq.yml**

Modify `config/sidekiq.yml` — add `weekly_analysis` entry under `:schedule:`:

```yaml
:concurrency: 5
:queues:
  - default

:scheduler:
  :schedule:
    nightly_sync:
      cron: "0 22 * * *"
      class: NightlySyncJob
      queue: default
    weekly_analysis:
      cron: "0 22 * * 0"
      class: WeeklyAnalysisJob
      queue: default
```

Note: `0 22 * * 0` = every Sunday at 10 PM.

**Step 3: Commit**

```bash
git add app/jobs/weekly_analysis_job.rb config/sidekiq.yml
git commit -m "feat: add WeeklyAnalysisJob scheduled Sundays 10 PM"
```

---

### Task 4: Update controller and routes for weekly reports

**Files:**
- Modify: `app/controllers/api/v1/daily_reports_controller.rb`
- Modify: `app/serializers/daily_report_serializer.rb`
- Modify: `config/routes.rb`

**Step 1: Add report_type to serializer**

Modify `app/serializers/daily_report_serializer.rb`:

```ruby
class DailyReportSerializer
  include JSONAPI::Serializer

  attributes :id, :date, :report_type, :analysis_text, :recommendations, :scores,
             :raw_data_snapshot, :model_used, :prompt_tokens, :completion_tokens
end
```

**Step 2: Update controller with type filtering and generate_weekly**

Replace `app/controllers/api/v1/daily_reports_controller.rb` with:

```ruby
module Api
  module V1
    class DailyReportsController < BaseController
      def index
        reports = current_user.daily_reports
        reports = reports.where(report_type: params[:type]) if params[:type].present?
        reports = reports.recent

        render_json(DailyReportSerializer, reports)
      end

      def show
        report = current_user.daily_reports.find(params[:id])
        render_json(DailyReportSerializer, report)
      end

      def generate
        date = params[:date] ? Date.parse(params[:date]) : Date.current
        report = DailyAnalysisService.new.call(current_user, date)

        if report.persisted?
          render_json(DailyReportSerializer, report, status: :created)
        else
          render_errors(report.errors.full_messages)
        end
      rescue StandardError => e
        render_error("Failed to generate report: #{e.message}", status: :internal_server_error)
      end

      def generate_weekly
        week_ending = params[:date] ? Date.parse(params[:date]) : Date.current
        report = WeeklyAnalysisService.new.call(current_user, week_ending)

        if report.persisted?
          render_json(DailyReportSerializer, report, status: :created)
        else
          render_errors(report.errors.full_messages)
        end
      rescue StandardError => e
        render_error("Failed to generate weekly report: #{e.message}", status: :internal_server_error)
      end
    end
  end
end
```

**Step 3: Add route**

Modify `config/routes.rb` — add `generate_weekly` to the daily_reports collection:

Change:
```ruby
resources :daily_reports, only: [:index, :show] do
  collection do
    post :generate
  end
end
```

To:
```ruby
resources :daily_reports, only: [:index, :show] do
  collection do
    post :generate
    post :generate_weekly
  end
end
```

**Step 4: Verify routes**

Run:
```bash
bin/rails routes | grep daily_reports
```

Expected output should include:
```
generate_weekly_daily_reports POST /api/v1/daily_reports/generate_weekly
```

**Step 5: Commit**

```bash
git add app/controllers/api/v1/daily_reports_controller.rb app/serializers/daily_report_serializer.rb config/routes.rb
git commit -m "feat: add generate_weekly endpoint and type filtering to reports"
```

---

### Task 5: Manual verification

**Step 1: Start Rails server**

```bash
cd /Users/joegrady/Development/projects/grokfit/api
bin/rails server
```

**Step 2: Test generate_weekly endpoint**

```bash
curl -X POST http://localhost:3000/api/v1/daily_reports/generate_weekly \
  -H "Content-Type: application/json"
```

Expected: JSON response with weekly analysis (or error if no ANTHROPIC_API_KEY is set — that's fine, it confirms the endpoint works).

**Step 3: Test type filtering**

```bash
# All reports
curl http://localhost:3000/api/v1/daily_reports

# Only weekly reports
curl "http://localhost:3000/api/v1/daily_reports?type=weekly"

# Only daily reports
curl "http://localhost:3000/api/v1/daily_reports?type=daily"
```

**Step 4: Verify sidekiq schedule**

```bash
bin/rails console -e development
Sidekiq::Scheduler.rufus_scheduler
# Should show both nightly_sync and weekly_analysis jobs
```
