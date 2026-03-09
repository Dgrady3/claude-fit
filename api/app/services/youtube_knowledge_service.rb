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
    transcript_text = fetch_transcript(video_id)

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
    transcript.map(&:text).join(" ")
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
    cleaned = content.gsub(/\A```json\s*/, "").gsub(/```\s*\z/, "").strip
    json = JSON.parse(cleaned, symbolize_names: true)
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
