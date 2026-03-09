# YouTube Knowledge Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract exercise science knowledge from YouTube videos and feed it into GrokFit's daily AI analysis.

**Architecture:** Rake task triggers YoutubeKnowledgeService which fetches transcripts via `youtube-transcript-rb`, sends to Claude for structured extraction, stores results in VideoKnowledge + ExerciseInsight models, and enriches DailyAnalysisService prompts with relevant knowledge.

**Tech Stack:** Rails 7.2, Ruby 3.3.8, `youtube-transcript-rb` gem, `anthropic-sdk-beta` gem, PostgreSQL JSONB

---

### Task 1: Add youtube-transcript-rb gem

**Files:**
- Modify: `Gemfile`

**Step 1: Add the gem**

Add to the main group in `Gemfile`:

```ruby
# YouTube transcripts
gem "youtube-transcript", github: "stadia/youtube-transcript-rb"
```

**Step 2: Bundle install**

Run: `bundle install`
Expected: Gem installs successfully

**Step 3: Commit**

```bash
git add Gemfile Gemfile.lock
git commit -m "feat: add youtube-transcript-rb gem for transcript fetching"
```

---

### Task 2: Create VideoKnowledge migration and model

**Files:**
- Create: `db/migrate/TIMESTAMP_create_video_knowledges.rb` (via generator)
- Create: `app/models/video_knowledge.rb`

**Step 1: Generate migration**

Run: `bin/rails generate migration CreateVideoKnowledges youtube_video_id:string:uniq title:string channel:string url:string duration_seconds:integer topic_summary:text key_takeaways:jsonb transcript:text model_used:string prompt_tokens:integer completion_tokens:integer processed_at:datetime`

**Step 2: Edit migration to add defaults and null constraints**

The migration should produce:

```ruby
class CreateVideoKnowledges < ActiveRecord::Migration[7.2]
  def change
    create_table :video_knowledges do |t|
      t.string :youtube_video_id, null: false
      t.string :title
      t.string :channel
      t.string :url
      t.integer :duration_seconds
      t.text :topic_summary
      t.jsonb :key_takeaways, default: []
      t.text :transcript
      t.string :model_used
      t.integer :prompt_tokens
      t.integer :completion_tokens
      t.datetime :processed_at

      t.timestamps
    end

    add_index :video_knowledges, :youtube_video_id, unique: true
    add_index :video_knowledges, :channel
  end
end
```

**Step 3: Create model**

Write `app/models/video_knowledge.rb`:

```ruby
class VideoKnowledge < ApplicationRecord
  has_many :exercise_insights, dependent: :destroy

  validates :youtube_video_id, presence: true, uniqueness: true
end
```

**Step 4: Run migration**

Run: `bin/rails db:migrate`
Expected: Migration succeeds, schema.rb updated

**Step 5: Commit**

```bash
git add db/migrate/ db/schema.rb app/models/video_knowledge.rb
git commit -m "feat: add VideoKnowledge model and migration"
```

---

### Task 3: Create ExerciseInsight migration and model

**Files:**
- Create: `db/migrate/TIMESTAMP_create_exercise_insights.rb` (via generator)
- Create: `app/models/exercise_insight.rb`

**Step 1: Generate migration**

Run: `bin/rails generate migration CreateExerciseInsights video_knowledge:references exercise_name:string muscle_group:string recommended_sets:string recommended_reps:string recommended_rest_seconds:string recommended_rpe:string key_insight:text confidence:decimal`

**Step 2: Edit migration for precision and indexes**

```ruby
class CreateExerciseInsights < ActiveRecord::Migration[7.2]
  def change
    create_table :exercise_insights do |t|
      t.references :video_knowledge, null: false, foreign_key: true
      t.string :exercise_name, null: false
      t.string :muscle_group
      t.string :recommended_sets
      t.string :recommended_reps
      t.string :recommended_rest_seconds
      t.string :recommended_rpe
      t.text :key_insight
      t.decimal :confidence, precision: 3, scale: 2

      t.timestamps
    end

    add_index :exercise_insights, :muscle_group
    add_index :exercise_insights, :exercise_name
  end
end
```

**Step 3: Create model**

Write `app/models/exercise_insight.rb`:

```ruby
class ExerciseInsight < ApplicationRecord
  belongs_to :video_knowledge

  validates :exercise_name, presence: true

  scope :for_muscle_group, ->(group) { where(muscle_group: group) }
  scope :high_confidence, -> { where("confidence >= ?", 0.7) }
end
```

**Step 4: Run migration**

Run: `bin/rails db:migrate`
Expected: Migration succeeds

**Step 5: Commit**

```bash
git add db/migrate/ db/schema.rb app/models/exercise_insight.rb
git commit -m "feat: add ExerciseInsight model and migration"
```

---

### Task 4: Build YoutubeKnowledgeService

**Files:**
- Create: `app/services/youtube_knowledge_service.rb`

**Step 1: Create the service**

Write `app/services/youtube_knowledge_service.rb`:

```ruby
class YoutubeKnowledgeService
  EXTRACTION_PROMPT = <<~PROMPT
    You are an exercise science researcher analyzing a YouTube video transcript.

    Extract ALL exercise science knowledge from this transcript. For each exercise discussed, extract specific recommendations.

    IMPORTANT: Respond ONLY with valid JSON in this exact format:
    {
      "topic_summary": "A 2-3 sentence summary of the video's main topic and conclusions",
      "key_takeaways": [
        "Key finding or recommendation 1",
        "Key finding or recommendation 2"
      ],
      "exercise_insights": [
        {
          "exercise_name": "Exercise Name (use standard gym terminology)",
          "muscle_group": "one of: chest, back, shoulders, biceps, triceps, quadriceps, hamstrings, glutes, calves, abs, forearms, traps, full_body",
          "recommended_sets": "e.g. 3-4 (per session)",
          "recommended_reps": "e.g. 6-12",
          "recommended_rest_seconds": "e.g. 90-120",
          "recommended_rpe": "e.g. 7-9 (Rate of Perceived Exertion)",
          "key_insight": "The most important takeaway about this exercise from the video",
          "confidence": 0.85
        }
      ]
    }

    Rules:
    - Only include exercises that are specifically discussed with actionable recommendations
    - Use standard exercise names (e.g. "Barbell Bench Press" not "flat bench")
    - Set confidence to 0.9+ if the creator gives explicit recommendations, 0.7-0.89 if implied, below 0.7 if loosely mentioned
    - If the video is about nutrition or general training principles (not specific exercises), return an empty exercise_insights array but still provide topic_summary and key_takeaways
    - Omit fields you cannot determine (set to null)
  PROMPT

  def initialize
    @claude = ClaudeClient.new
  end

  def process(video_url)
    video_id = extract_video_id(video_url)
    raise ArgumentError, "Invalid YouTube URL: #{video_url}" unless video_id

    existing = VideoKnowledge.find_by(youtube_video_id: video_id)
    if existing
      puts "Video already processed: #{existing.title}"
      return existing
    end

    puts "Fetching transcript for #{video_id}..."
    transcript_data = fetch_transcript(video_id)
    transcript_text = transcript_data.map { |segment| segment["text"] }.join(" ")

    puts "Transcript fetched (#{transcript_text.split.size} words). Sending to Claude..."
    response = extract_knowledge(transcript_text)

    puts "Creating records..."
    parsed = parse_response(response[:content])

    video_knowledge = VideoKnowledge.create!(
      youtube_video_id: video_id,
      url: video_url,
      channel: "Jeff Nippard",
      title: parsed[:topic_summary]&.truncate(255) || "Unknown",
      topic_summary: parsed[:topic_summary],
      key_takeaways: parsed[:key_takeaways] || [],
      transcript: transcript_text,
      model_used: response[:model],
      prompt_tokens: response[:prompt_tokens],
      completion_tokens: response[:completion_tokens],
      processed_at: Time.current
    )

    create_exercise_insights(video_knowledge, parsed[:exercise_insights])

    puts "Done! Created #{video_knowledge.exercise_insights.count} exercise insights."
    video_knowledge
  end

  private

  def extract_video_id(url)
    patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    patterns.each do |pattern|
      match = url.match(pattern)
      return match[1] if match
    end
    nil
  end

  def fetch_transcript(video_id)
    api = YoutubeRb::Transcript::YouTubeTranscriptApi.new
    transcript = api.fetch(video_id, languages: ["en"])
    transcript.map { |snippet| { "text" => snippet.text, "start" => snippet.start, "duration" => snippet.duration } }
  end

  def extract_knowledge(transcript_text)
    @claude.chat(
      system: EXTRACTION_PROMPT,
      messages: [{ role: "user", content: "Here is the video transcript to analyze:\n\n#{transcript_text}" }],
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096
    )
  end

  def parse_response(content)
    json = JSON.parse(content, symbolize_names: true)
    {
      topic_summary: json[:topic_summary],
      key_takeaways: json[:key_takeaways],
      exercise_insights: json[:exercise_insights] || []
    }
  rescue JSON::ParserError => e
    puts "WARNING: Failed to parse Claude response as JSON: #{e.message}"
    puts "Raw response: #{content[0..500]}"
    { topic_summary: content.truncate(500), key_takeaways: [], exercise_insights: [] }
  end

  def create_exercise_insights(video_knowledge, insights)
    insights.each do |insight|
      video_knowledge.exercise_insights.create!(
        exercise_name: insight[:exercise_name],
        muscle_group: insight[:muscle_group],
        recommended_sets: insight[:recommended_sets],
        recommended_reps: insight[:recommended_reps],
        recommended_rest_seconds: insight[:recommended_rest_seconds],
        recommended_rpe: insight[:recommended_rpe],
        key_insight: insight[:key_insight],
        confidence: insight[:confidence]
      )
    end
  end
end
```

**Step 2: Commit**

```bash
git add app/services/youtube_knowledge_service.rb
git commit -m "feat: add YoutubeKnowledgeService for video knowledge extraction"
```

---

### Task 5: Create rake task

**Files:**
- Create: `lib/tasks/youtube.rake`

**Step 1: Create the rake task**

Write `lib/tasks/youtube.rake`:

```ruby
namespace :youtube do
  desc "Process a YouTube video and extract exercise science knowledge"
  task process: :environment do
    url = ENV["VIDEO_URL"]
    abort "Usage: rake youtube:process VIDEO_URL=https://youtube.com/watch?v=..." unless url

    service = YoutubeKnowledgeService.new
    video = service.process(url)

    puts "\n=== Video Knowledge ==="
    puts "Title: #{video.title}"
    puts "Summary: #{video.topic_summary}"
    puts "\nKey Takeaways:"
    video.key_takeaways.each_with_index { |t, i| puts "  #{i + 1}. #{t}" }
    puts "\nExercise Insights (#{video.exercise_insights.count}):"
    video.exercise_insights.each do |insight|
      puts "  - #{insight.exercise_name} (#{insight.muscle_group})"
      puts "    Sets: #{insight.recommended_sets}, Reps: #{insight.recommended_reps}, Rest: #{insight.recommended_rest_seconds}s"
      puts "    RPE: #{insight.recommended_rpe}, Confidence: #{insight.confidence}"
      puts "    Insight: #{insight.key_insight}"
    end
    puts "\nTokens used: #{video.prompt_tokens} input, #{video.completion_tokens} output"
  end
end
```

**Step 2: Commit**

```bash
git add lib/tasks/youtube.rake
git commit -m "feat: add youtube:process rake task"
```

---

### Task 6: Enrich DailyAnalysisService with video knowledge

**Files:**
- Modify: `app/services/daily_analysis_service.rb`

**Step 1: Add knowledge enrichment to system_prompt method**

Add a private method `exercise_knowledge_context` and call it from `system_prompt`:

```ruby
# In system_prompt method, append before the closing PROMPT:
#{exercise_knowledge_context(user, date)}

# New private method:
def exercise_knowledge_context(user, date)
  # Find muscle groups the user trained today
  todays_exercises = SessionSet
    .joins(:exercise)
    .where(workout_session: user.workout_sessions.where(started_at: date.all_day))
    .pluck("exercises.muscle_group")
    .uniq
    .compact

  return "" if todays_exercises.empty?

  insights = ExerciseInsight
    .where(muscle_group: todays_exercises)
    .where("confidence >= ?", 0.7)
    .includes(:video_knowledge)

  return "" if insights.empty?

  context = "\nExercise Science Context (from research videos):\n"
  insights.group_by(&:muscle_group).each do |muscle_group, group_insights|
    context += "\n#{muscle_group.titleize}:\n"
    group_insights.each do |insight|
      context += "- #{insight.exercise_name}: #{insight.key_insight}"
      context += " (Sets: #{insight.recommended_sets}, Reps: #{insight.recommended_reps})" if insight.recommended_sets
      context += "\n"
    end
  end
  context
end
```

**Step 2: Commit**

```bash
git add app/services/daily_analysis_service.rb
git commit -m "feat: enrich DailyAnalysisService with video knowledge context"
```

---

### Task 7: End-to-end test on a single Jeff Nippard video

**Step 1: Test the full pipeline**

Run: `rake youtube:process VIDEO_URL=https://www.youtube.com/watch?v=hPlKPjohzS0`

(This is Jeff Nippard's "The Most Effective Way to Train CHEST" video)

Expected: Successful output showing topic summary, key takeaways, and exercise insights with sets/reps/rest recommendations.

**Step 2: Verify data in Rails console**

Run: `bin/rails console`

```ruby
vk = VideoKnowledge.last
puts vk.topic_summary
puts vk.key_takeaways
vk.exercise_insights.each { |i| puts "#{i.exercise_name} (#{i.muscle_group}) - #{i.confidence}" }
```

Expected: Records exist with reasonable data.

**Step 3: Commit the design doc**

```bash
git add docs/
git commit -m "docs: add youtube knowledge pipeline design and implementation plan"
```
