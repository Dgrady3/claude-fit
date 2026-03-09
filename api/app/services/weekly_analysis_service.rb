class WeeklyAnalysisService
  def call(user, week_ending = Date.current)
    week_end = week_ending
    week_start = week_end - 6.days
    prev_week_end = week_start - 1.day
    prev_week_start = prev_week_end - 6.days

    this_week = gather_week_data(user, week_start, week_end)
    last_week = gather_week_data(user, prev_week_start, prev_week_end)

    data = {
      this_week: this_week,
      last_week: last_week,
      training_history: training_history(user, week_end),
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
      activity: activity_summary(user, start_date, end_date),
      daily_breakdown: daily_breakdown(user, sessions, start_date, end_date)
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
      total_steps: data.sum(:steps),
      avg_active_calories: (data.average(:active_calories)&.round(0))
    }
  end

  # Per-day breakdown: classify each day as lifting, cardio-only (high steps/active cals but no lift), or rest
  def daily_breakdown(user, sessions, start_date, end_date)
    lifting_dates = sessions.map { |s| s.started_at.to_date }.uniq

    (start_date..end_date).map do |date|
      activity = user.oura_activity_data.find_by(date: date)
      steps = activity&.steps || 0
      active_cal = activity&.active_calories || 0
      lifted = lifting_dates.include?(date)

      day_type = if lifted
                   "lifting"
                 elsif steps >= 8000 || active_cal >= 300
                   "cardio/walk"
                 else
                   "rest"
                 end

      {
        date: date.strftime("%a %b %d"),
        type: day_type,
        steps: steps,
        active_calories: active_cal,
        lifted: lifted
      }
    end
  end

  # 4-week per-exercise trend data for progressive overload analysis
  def training_history(user, week_end)
    four_weeks_ago = week_end - 27.days

    sessions = user.workout_sessions.completed
      .where(started_at: four_weeks_ago.beginning_of_day..week_end.end_of_day)
      .includes(session_sets: :exercise)

    # Group sessions into weekly buckets
    weeks = {}
    sessions.each do |session|
      week_label = session.started_at.to_date.beginning_of_week(:monday).strftime("%b %d")
      weeks[week_label] ||= []
      weeks[week_label] << session
    end

    # Per-exercise trends across all 4 weeks
    all_sets = sessions.flat_map { |s| s.session_sets.working_sets }
    exercise_trends = all_sets.group_by { |s| s.exercise.name }.transform_values do |ex_sets|
      by_week = ex_sets.group_by { |s| s.workout_session.started_at.to_date.beginning_of_week(:monday).strftime("%b %d") }
      by_week.transform_values do |week_sets|
        max_w = week_sets.map(&:weight_lbs).max
        {
          max_weight: max_w,
          best_set: "#{max_w} x #{week_sets.select { |s| s.weight_lbs == max_w }.map(&:reps).max}",
          total_sets: week_sets.size,
          total_volume: week_sets.sum { |s| s.weight_lbs * s.reps }
        }
      end
    end

    # Weekly volume totals
    weekly_volume = weeks.transform_values do |week_sessions|
      sets = week_sessions.flat_map { |s| s.session_sets.working_sets }
      {
        sessions: week_sessions.size,
        total_volume: sets.sum { |s| s.weight_lbs * s.reps },
        total_sets: sets.size
      }
    end

    {
      weeks_covered: weeks.keys.sort,
      weekly_totals: weekly_volume,
      exercise_trends: exercise_trends
    }
  end

  def system_prompt(user)
    goals = user.user_goals.index_by(&:goal_type)
    target_weight = goals["target_weight"]&.target_value
    target_bf = goals["body_fat_pct"]&.target_value
    protein_target = goals["daily_protein_g"]&.target_value
    calorie_target = goals["daily_calories"]&.target_value

    <<~PROMPT
      You are Claude-Fit, an expert body composition coach and health analyst. You provide weekly analysis reports focused on helping users build muscle and lose body fat.

      User Profile:
      - Name: #{user.name || "User"}
      - Age: #{user.age || "Unknown"}
      - Sex: #{user.sex || "Unknown"}
      - Current Weight: #{user.body_weight_lbs || "Unknown"} lbs
      - Height: #{user.height_inches || "Unknown"} inches
      #{target_weight ? "- Target Weight: #{target_weight} lbs" : ""}
      #{target_bf ? "- Target Body Fat: #{target_bf}%" : ""}
      #{protein_target ? "- Daily Protein Target: #{protein_target}g" : ""}
      #{calorie_target ? "- Daily Calorie Target: #{calorie_target} kcal" : ""}

      Your analysis MUST connect body composition goals to the data holistically:

      MACRO & BODY COMP ANALYSIS:
      - Calculate protein per lb of bodyweight from their actual intake vs current weight. For muscle gain while losing fat, they need 0.8-1.2g/lb.
      - Assess whether calorie intake supports their specific goal: if current weight > target weight, they need a deficit (TDEE minus 300-500); if gaining muscle is priority, a slight surplus (TDEE plus 200-300).
      - Evaluate macro split (protein/carbs/fat ratios) for body composition optimization.
      - Connect nutrition consistency to training performance — are low-intake days correlating with weaker sessions?

      STEPS, CARDIO & ACTIVE RECOVERY:
      - Daily steps (target 8,000-10,000) are a major NEAT contributor. At #{user.body_weight_lbs || 185} lbs, ~100 steps ≈ 4-5 calories burned.
      - Each day is classified as "lifting", "cardio/walk" (high steps or active calories but no lifting), or "rest". Use this to evaluate training split and active recovery.
      - Cardio/walk days still contribute to fat loss and cardiovascular health — they are NOT wasted days. Walking/running on non-lifting days supports recovery, increases TDEE, and accelerates fat loss.
      - Ideal week structure: 3-5 lifting days + 1-2 cardio/walk days + 1-2 rest days. Analyze whether the user's day-type distribution supports their goals.
      - More steps = higher TDEE = can eat more while still losing fat, or accelerates fat loss at current intake.

      TRAINING & PROGRESSIVE OVERLOAD:
      - Progressive overload is the #1 driver of muscle growth — track whether weights, reps, or volume are trending up per exercise over the 4-week history.
      - Adequate protein + progressive overload = muscle gain. Missing either one stalls progress.
      - Training volume and nutrition must be calibrated together — high volume with insufficient protein/calories leads to overtraining, not growth.

      RECOVERY:
      - Sleep and recovery (HRV, readiness) directly impact muscle protein synthesis and hormone regulation.
      - Poor recovery + high training volume = catabolism risk.
      - Consistency matters more than perfection. Multi-week trends matter more than any single day.

      Scoring Rules:
      - Rate each category (nutrition, sleep, recovery, training) on a 1-10 scale
      - Provide an overall weekly score (1-100)
      - Be honest — if data is missing or insufficient, say so rather than guessing

      #{health_context(user)}
      IMPORTANT: Respond with ONLY raw valid JSON. No markdown, no code fences, no backticks. Just the JSON object in this exact format:
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

  def health_context(user)
    contexts = user.health_contexts.recent.limit(10)
    return "" if contexts.empty?

    context = "\nUser Health Context (from imported conversations):\n"
    contexts.group_by(&:category).each do |category, items|
      context += "\n#{category.titleize}:\n"
      items.each do |item|
        snippet = item.content.length > 500 ? item.content[0..497] + "..." : item.content
        context += "- #{snippet}\n"
      end
    end
    context += "\nUse this context to personalize recommendations. Reference relevant history when applicable.\n"
    context
  end

  def build_prompt(data, week_start, week_end)
    <<~PROMPT
      Generate my weekly body composition analysis for the week of #{week_start.strftime("%B %d")} - #{week_end.strftime("%B %d, %Y")}.

      THIS WEEK'S DATA:
      #{JSON.pretty_generate(data[:this_week])}

      LAST WEEK'S DATA (for comparison):
      #{JSON.pretty_generate(data[:last_week])}

      4-WEEK TRAINING HISTORY (for progressive overload trend analysis):
      #{JSON.pretty_generate(data[:training_history])}

      MY GOALS:
      #{JSON.pretty_generate(data[:goals])}

      Analyze:
      1. BODY COMP TRAJECTORY: Given my current weight, target weight, and body fat goal — am I on track? At my current caloric intake and activity level, estimate whether I'm in a surplus or deficit and how that aligns with my goals.
      2. MACROS VS BODY WEIGHT: Calculate my protein per lb of bodyweight. Am I eating enough protein for my current weight to support muscle growth? How do my carbs and fats look for energy and recovery?
      3. ENERGY BALANCE: Factor in my daily steps (NEAT), training volume, and caloric intake. Am I creating the right energy balance for my goal — slight deficit for fat loss, slight surplus for muscle gain, or recomp?
      4. TRAINING TRENDS: For each exercise in my 4-week history, are weights/reps/volume trending up (progressive overload), plateauing, or regressing? Call out specific exercises by name.
      5. NUTRITION + TRAINING CONNECTION: Are my macro intake and training performance correlated? Do low-nutrition days line up with weaker sessions?
      6. ACTIVITY SPLIT: Look at my daily breakdown (lifting vs cardio/walk vs rest days). Am I getting enough active days? On non-lifting days, am I still moving enough (steps/walks/runs) to support fat loss? Credit cardio/walk days as productive training days, not wasted days.
      7. RECOVERY: Are my sleep and HRV metrics supporting my training load and body composition goals?
      8. Give me 3-5 specific, actionable things to adjust next week — tie each recommendation back to my body comp goals.
    PROMPT
  end

  def parse_response(content)
    cleaned = content.gsub(/```(?:json)?/i, "").strip

    # Fix common Claude JSON issues: missing commas between top-level keys
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
    # Fallback: extract each field individually with regex
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
