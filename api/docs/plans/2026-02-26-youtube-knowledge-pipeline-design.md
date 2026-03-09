# YouTube Knowledge Pipeline Design

## Overview

Extract exercise science knowledge from Jeff Nippard's YouTube videos using transcript fetching + Claude analysis. Store structured insights and feed them into DailyAnalysisService to improve daily health reports.

## Data Models

### video_knowledges

| Column | Type | Notes |
|---|---|---|
| youtube_video_id | string, unique | e.g. `dQw4w9WgXcQ` |
| title | string | Video title |
| channel | string | e.g. `Jeff Nippard` |
| url | string | Full URL |
| duration_seconds | integer | Video length |
| topic_summary | text | Claude-generated summary |
| key_takeaways | jsonb | Array of top-level insights |
| transcript | text | Raw transcript |
| model_used | string | Claude model used |
| prompt_tokens | integer | Token tracking |
| completion_tokens | integer | Token tracking |
| processed_at | datetime | When extraction ran |

### exercise_insights

| Column | Type | Notes |
|---|---|---|
| video_knowledge_id | FK | Source video |
| exercise_name | string | Normalized exercise name |
| muscle_group | string | Primary muscle group |
| recommended_sets | string | e.g. "3-4" |
| recommended_reps | string | e.g. "6-12" |
| recommended_rest_seconds | string | e.g. "90-120" |
| recommended_rpe | string | e.g. "7-9" |
| key_insight | text | Main takeaway |
| confidence | decimal(3,2) | Claude's extraction confidence (0-1) |

No FK to exercises table - fuzzy matching at query time.

## Pipeline Architecture

### YoutubeKnowledgeService

1. Parse YouTube URL -> extract video ID
2. Fetch transcript via `youtube-transcript-rb` gem
3. Send transcript to Claude with structured extraction prompt
4. Parse JSON response
5. Create VideoKnowledge + ExerciseInsight records
6. Return the VideoKnowledge record

### Extraction Prompt

Claude acts as exercise science researcher. Returns JSON:
```json
{
  "topic_summary": "...",
  "key_takeaways": ["...", "..."],
  "exercise_insights": [
    {
      "exercise_name": "Bench Press",
      "muscle_group": "chest",
      "recommended_sets": "3-4",
      "recommended_reps": "6-12",
      "recommended_rest_seconds": "90-120",
      "recommended_rpe": "7-9",
      "key_insight": "...",
      "confidence": 0.85
    }
  ]
}
```

### Rake Task

```
rake youtube:process VIDEO_URL=https://youtube.com/watch?v=xyz
```

## DailyAnalysisService Integration

- Query ExerciseInsight records matching muscle groups trained that day
- Append "Exercise Science Context" section to system prompt
- Match via: session_sets -> exercise -> muscle_group == exercise_insights.muscle_group

## Approach

- Single-pass extraction (one Claude call per video)
- Approach A chosen for simplicity and cost (~$0.05/video)
- Transcript fetching via `youtube-transcript-rb` Ruby gem (no Python dependency)

## Cost

- ~$0.05 per video processed
- ~$0.003 extra per daily report (knowledge injection)
