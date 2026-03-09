class RootCauseService
  def call(user)
    end_date = Date.current
    start_date = end_date - 28.days

    sessions = user.workout_sessions.completed
      .where(started_at: start_date.beginning_of_day..end_date.end_of_day)
      .includes(session_sets: :exercise)

    sleep_data = user.oura_sleep_data.where(date: start_date..end_date).order(:date)
    readiness_data = user.oura_readiness_data.where(date: start_date..end_date).order(:date)
    nutrition = user.nutrition_entries.where(date: start_date..end_date)

    exercise_trends = build_exercise_trends(sessions)

    daily_nutrition = nutrition.group(:date).select(
      "date, SUM(calories) as calories, SUM(protein_g) as protein_g"
    ).order(:date).map { |r| { date: r.date, calories: r.calories.to_f, protein: r.protein_g.to_f } }

    data = {
      exercise_trends: exercise_trends,
      sleep: sleep_data.map { |s| { date: s.date, score: s.sleep_score, efficiency: s.efficiency&.to_f, total_hours: (s.total_sleep_minutes.to_f / 60).round(1) } },
      readiness: readiness_data.map { |r| { date: r.date, score: r.readiness_score, hrv: r.hrv_average&.to_f } },
      nutrition: daily_nutrition,
      user_weight: user.try(:body_weight_lbs)
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
