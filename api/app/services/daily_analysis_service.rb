class DailyAnalysisService
  def call(user, date = Date.current)
    data = gather_data(user, date)
    prompt = build_prompt(user, data, date)

    response = ClaudeClient.new.chat(
      system: system_prompt(user, date),
      messages: [{ role: "user", content: prompt }],
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096
    )

    parsed = parse_response(response[:content])

    report = user.daily_reports.find_or_initialize_by(date: date)
    report.update!(
      analysis_text: parsed[:analysis],
      recommendations: parsed[:recommendations] || {},
      scores: parsed[:scores] || {},
      raw_data_snapshot: data,
      model_used: response[:model],
      prompt_tokens: response[:prompt_tokens],
      completion_tokens: response[:completion_tokens]
    )

    report
  end

  private

  def gather_data(user, date)
    week_ago = date - 7.days

    {
      nutrition_today: user.nutrition_entries.for_date(date).as_json,
      nutrition_7day_avg: nutrition_averages(user, week_ago, date),
      sleep_today: user.oura_sleep_data.find_by(date: date)&.as_json,
      sleep_7day_avg: sleep_averages(user, week_ago, date),
      readiness_today: user.oura_readiness_data.find_by(date: date)&.as_json,
      activity_today: user.oura_activity_data.find_by(date: date)&.as_json,
      workouts_today: user.workout_sessions.where(started_at: date.all_day).as_json,
      workouts_7day: user.workout_sessions.where(started_at: week_ago..date.end_of_day).count,
      goals: user.user_goals.as_json
    }
  end

  def nutrition_averages(user, start_date, end_date)
    entries = user.nutrition_entries.where(date: start_date..end_date)
    days = (end_date - start_date).to_i.clamp(1, 7)

    {
      avg_calories: (entries.sum(:calories).to_f / days).round(1),
      avg_protein: (entries.sum(:protein_g).to_f / days).round(1),
      avg_carbs: (entries.sum(:carbs_g).to_f / days).round(1),
      avg_fat: (entries.sum(:fat_g).to_f / days).round(1)
    }
  end

  def sleep_averages(user, start_date, end_date)
    data = user.oura_sleep_data.where(date: start_date..end_date)
    count = data.count.clamp(1, 7)

    {
      avg_score: (data.sum(:sleep_score).to_f / count).round(1),
      avg_total_minutes: (data.sum(:total_sleep_minutes).to_f / count).round(1),
      avg_deep_minutes: (data.sum(:deep_sleep_minutes).to_f / count).round(1)
    }
  end

  def system_prompt(user, date)
    <<~PROMPT
      You are Claude-Fit, an expert health and fitness analyst. You provide daily health intelligence reports.

      User Profile:
      - Name: #{user.name || "User"}
      - Age: #{user.age || "Unknown"}
      - Sex: #{user.sex || "Unknown"}
      - Weight: #{user.body_weight_lbs || "Unknown"} lbs
      - Height: #{user.height_inches || "Unknown"} inches

      Scoring Rules:
      - Rate each category (nutrition, sleep, recovery, training) on a 1-10 scale
      - Provide an overall daily score (1-100)
      - Be specific and actionable in recommendations
      - Reference the user's goals when making recommendations
      #{exercise_knowledge_context(user, date)}
      #{health_context(user)}
      IMPORTANT: Respond ONLY with valid JSON in this exact format:
      {
        "analysis": "Your detailed analysis text here",
        "scores": {
          "overall": 75,
          "nutrition": 7,
          "sleep": 8,
          "recovery": 6,
          "training": 7
        },
        "recommendations": [
          "Specific recommendation 1",
          "Specific recommendation 2",
          "Specific recommendation 3"
        ]
      }
    PROMPT
  end

  def exercise_knowledge_context(user, date)
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

  def health_context(user)
    contexts = user.health_contexts.recent.limit(10)
    return "" if contexts.empty?

    context = "\nUser Health Context (from imported conversations):\n"
    contexts.group_by(&:category).each do |category, items|
      context += "\n#{category.titleize}:\n"
      items.each do |item|
        # Trim to avoid prompt bloat — keep first 500 chars per item
        snippet = item.content.length > 500 ? item.content[0..497] + "..." : item.content
        context += "- #{snippet}\n"
      end
    end
    context += "\nUse this context to personalize recommendations. Reference relevant history when applicable.\n"
    context
  end

  def build_prompt(user, data, date)
    <<~PROMPT
      Generate my daily health intelligence report for #{date}.

      Today's Data:
      #{JSON.pretty_generate(data)}

      Analyze my nutrition, sleep, recovery, and training for today. Compare against my 7-day averages and goals. Provide specific, actionable recommendations.
    PROMPT
  end

  def parse_response(content)
    cleaned = content.gsub(/```(?:json)?/i, "").strip
    fixed = cleaned
      .gsub(/"\s*\n\s*"(scores|recommendations|analysis)"/, '", "\1"')
      .gsub(/\}\s*\n\s*"(scores|recommendations|analysis)"/, '}, "\1"')
      .gsub(/\]\s*\n\s*"(scores|recommendations|analysis)"/, '], "\1"')

    json = JSON.parse(fixed, symbolize_names: true)
    {
      analysis: json[:analysis],
      scores: json[:scores],
      recommendations: json[:recommendations]
    }
  rescue JSON::ParserError
    analysis = content.match(/"analysis"\s*:\s*"((?:[^"\\]|\\.)*)"/m)&.captures&.first
    scores_match = content.match(/"scores"\s*:\s*(\{[^}]+\})/m)
    recs_match = content.match(/"recommendations"\s*:\s*(\[.*?\])/m)

    scores = scores_match ? (JSON.parse(scores_match[1], symbolize_names: true) rescue {}) : {}
    recommendations = recs_match ? (JSON.parse(recs_match[1]) rescue []) : []

    {
      analysis: analysis&.gsub('\\n', "\n")&.gsub('\\"', '"') || content,
      scores: scores,
      recommendations: recommendations
    }
  end
end
