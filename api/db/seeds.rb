puts "Seeding exercises..."

exercises_data = {
  "Chest" => [
    { name: "Barbell Bench Press", equipment: "Barbell" },
    { name: "Incline Barbell Bench Press", equipment: "Barbell" },
    { name: "Decline Barbell Bench Press", equipment: "Barbell" },
    { name: "Dumbbell Bench Press", equipment: "Dumbbell" },
    { name: "Incline Dumbbell Press", equipment: "Dumbbell" },
    { name: "Cable Fly", equipment: "Cable" },
    { name: "Pec Deck", equipment: "Machine" },
    { name: "Push-Up", equipment: "Bodyweight" },
    { name: "Chest Dip", equipment: "Bodyweight" }
  ],
  "Back" => [
    { name: "Barbell Row", equipment: "Barbell" },
    { name: "Deadlift", equipment: "Barbell" },
    { name: "Pull-Up", equipment: "Bodyweight" },
    { name: "Lat Pulldown", equipment: "Cable" },
    { name: "Seated Cable Row", equipment: "Cable" },
    { name: "Dumbbell Row", equipment: "Dumbbell" },
    { name: "T-Bar Row", equipment: "Barbell" },
    { name: "Face Pull", equipment: "Cable" }
  ],
  "Shoulders" => [
    { name: "Overhead Press", equipment: "Barbell" },
    { name: "Dumbbell Shoulder Press", equipment: "Dumbbell" },
    { name: "Lateral Raise", equipment: "Dumbbell" },
    { name: "Front Raise", equipment: "Dumbbell" },
    { name: "Reverse Fly", equipment: "Dumbbell" },
    { name: "Arnold Press", equipment: "Dumbbell" },
    { name: "Upright Row", equipment: "Barbell" }
  ],
  "Biceps" => [
    { name: "Barbell Curl", equipment: "Barbell" },
    { name: "Dumbbell Curl", equipment: "Dumbbell" },
    { name: "Hammer Curl", equipment: "Dumbbell" },
    { name: "Preacher Curl", equipment: "Machine" },
    { name: "Concentration Curl", equipment: "Dumbbell" },
    { name: "Cable Curl", equipment: "Cable" }
  ],
  "Triceps" => [
    { name: "Tricep Pushdown", equipment: "Cable" },
    { name: "Overhead Tricep Extension", equipment: "Cable" },
    { name: "Close-Grip Bench Press", equipment: "Barbell" },
    { name: "Skull Crusher", equipment: "Barbell" },
    { name: "Dip", equipment: "Bodyweight" },
    { name: "Kickback", equipment: "Dumbbell" }
  ],
  "Legs" => [
    { name: "Barbell Squat", equipment: "Barbell" },
    { name: "Front Squat", equipment: "Barbell" },
    { name: "Leg Press", equipment: "Machine" },
    { name: "Romanian Deadlift", equipment: "Barbell" },
    { name: "Leg Curl", equipment: "Machine" },
    { name: "Leg Extension", equipment: "Machine" },
    { name: "Bulgarian Split Squat", equipment: "Dumbbell" },
    { name: "Calf Raise", equipment: "Machine" },
    { name: "Hip Thrust", equipment: "Barbell" },
    { name: "Goblet Squat", equipment: "Dumbbell" }
  ],
  "Core" => [
    { name: "Plank", equipment: "Bodyweight" },
    { name: "Cable Crunch", equipment: "Cable" },
    { name: "Hanging Leg Raise", equipment: "Bodyweight" },
    { name: "Ab Wheel Rollout", equipment: "Other" },
    { name: "Russian Twist", equipment: "Bodyweight" },
    { name: "Woodchop", equipment: "Cable" }
  ],
  "Cardio" => [
    { name: "Treadmill Run", equipment: "Machine" },
    { name: "Rowing Machine", equipment: "Machine" },
    { name: "Stationary Bike", equipment: "Machine" },
    { name: "Stair Climber", equipment: "Machine" },
    { name: "Jump Rope", equipment: "Other" }
  ]
}

exercises_data.each do |muscle_group, exercises|
  exercises.each do |attrs|
    Exercise.find_or_create_by!(name: attrs[:name], user_id: nil) do |e|
      e.muscle_group = muscle_group
      e.equipment = attrs[:equipment]
    end
  end
end

puts "Created #{Exercise.count} exercises"

# Demo user
puts "Creating demo user..."
demo = User.find_or_create_by!(email: "demo@claude-fit.dev") do |u|
  u.password = "password123"
  u.name = "Demo User"
  u.body_weight_lbs = 185.0
  u.height_inches = 71
  u.age = 30
  u.sex = "male"
end

# Demo goals
puts "Creating demo goals..."
UserGoal.find_or_create_by!(user: demo, goal_type: "daily_protein_g") do |g|
  g.target_value = 180
  g.current_value = 155
end
UserGoal.find_or_create_by!(user: demo, goal_type: "daily_calories") do |g|
  g.target_value = 2800
  g.current_value = 2500
end

# Sample Programs
puts "Creating sample programs..."

# Push/Pull/Legs
push = WorkoutProgram.find_or_create_by!(user: demo, name: "Push Day") do |p|
  p.description = "Chest, shoulders, and triceps"
  p.active = true
end

pull = WorkoutProgram.find_or_create_by!(user: demo, name: "Pull Day") do |p|
  p.description = "Back and biceps"
  p.active = true
end

legs = WorkoutProgram.find_or_create_by!(user: demo, name: "Leg Day") do |p|
  p.description = "Quads, hamstrings, glutes, and calves"
  p.active = true
end

upper = WorkoutProgram.find_or_create_by!(user: demo, name: "Upper Body") do |p|
  p.description = "Full upper body workout"
  p.active = false
end

lower = WorkoutProgram.find_or_create_by!(user: demo, name: "Lower Body") do |p|
  p.description = "Full lower body workout"
  p.active = false
end

# Program exercises
push_exercises = ["Barbell Bench Press", "Incline Dumbbell Press", "Cable Fly",
                  "Overhead Press", "Lateral Raise", "Tricep Pushdown", "Skull Crusher"]
push_exercises.each_with_index do |name, i|
  ex = Exercise.find_by!(name: name, user_id: nil)
  ProgramExercise.find_or_create_by!(workout_program: push, exercise: ex) do |pe|
    pe.position = i + 1
    pe.target_sets = name.include?("Bench") ? 4 : 3
    pe.target_reps = name.include?("Lateral") ? 15 : 10
  end
end

pull_exercises = ["Deadlift", "Barbell Row", "Lat Pulldown", "Seated Cable Row",
                  "Face Pull", "Barbell Curl", "Hammer Curl"]
pull_exercises.each_with_index do |name, i|
  ex = Exercise.find_by!(name: name, user_id: nil)
  ProgramExercise.find_or_create_by!(workout_program: pull, exercise: ex) do |pe|
    pe.position = i + 1
    pe.target_sets = name == "Deadlift" ? 4 : 3
    pe.target_reps = name == "Deadlift" ? 5 : 10
  end
end

leg_exercises = ["Barbell Squat", "Romanian Deadlift", "Leg Press", "Leg Curl",
                 "Leg Extension", "Bulgarian Split Squat", "Calf Raise"]
leg_exercises.each_with_index do |name, i|
  ex = Exercise.find_by!(name: name, user_id: nil)
  ProgramExercise.find_or_create_by!(workout_program: legs, exercise: ex) do |pe|
    pe.position = i + 1
    pe.target_sets = name.include?("Squat") ? 4 : 3
    pe.target_reps = name.include?("Calf") ? 15 : 10
  end
end

upper_exercises = ["Barbell Bench Press", "Barbell Row", "Overhead Press",
                   "Lat Pulldown", "Lateral Raise", "Barbell Curl", "Tricep Pushdown"]
upper_exercises.each_with_index do |name, i|
  ex = Exercise.find_by!(name: name, user_id: nil)
  ProgramExercise.find_or_create_by!(workout_program: upper, exercise: ex) do |pe|
    pe.position = i + 1
    pe.target_sets = 3
    pe.target_reps = 10
  end
end

lower_exercises = ["Barbell Squat", "Romanian Deadlift", "Leg Press", "Leg Curl",
                   "Hip Thrust", "Calf Raise", "Goblet Squat"]
lower_exercises.each_with_index do |name, i|
  ex = Exercise.find_by!(name: name, user_id: nil)
  ProgramExercise.find_or_create_by!(workout_program: lower, exercise: ex) do |pe|
    pe.position = i + 1
    pe.target_sets = 3
    pe.target_reps = 10
  end
end

# ---------------------------------------------------------------------------
# 90 days of workout sessions with progressive overload
# ---------------------------------------------------------------------------
puts "Creating 90 days of workout sessions..."

# Base weights for each exercise at day 90 ago (starting point).
# Over 90 days we add progressive overload: ~10-15% increase for compounds,
# ~5-10 lbs for accessories.
exercise_base_weights = {
  # Push
  "Barbell Bench Press"     => 175, "Incline Dumbbell Press" => 55,
  "Cable Fly"               => 30,  "Overhead Press"         => 105,
  "Lateral Raise"           => 20,  "Tricep Pushdown"        => 50,
  "Skull Crusher"           => 65,
  # Pull
  "Deadlift"                => 275, "Barbell Row"            => 155,
  "Lat Pulldown"            => 130, "Seated Cable Row"       => 120,
  "Face Pull"               => 40,  "Barbell Curl"           => 75,
  "Hammer Curl"             => 30,
  # Legs
  "Barbell Squat"           => 225, "Romanian Deadlift"      => 185,
  "Leg Press"               => 320, "Leg Curl"               => 90,
  "Leg Extension"           => 100, "Bulgarian Split Squat"  => 40,
  "Calf Raise"              => 150
}

# Weight gained over 90 days (total lbs to add)
exercise_weight_gain = {
  "Barbell Bench Press"     => 25,  "Incline Dumbbell Press" => 10,
  "Cable Fly"               => 5,   "Overhead Press"         => 15,
  "Lateral Raise"           => 5,   "Tricep Pushdown"        => 10,
  "Skull Crusher"           => 10,
  "Deadlift"                => 35,  "Barbell Row"            => 20,
  "Lat Pulldown"            => 15,  "Seated Cable Row"       => 15,
  "Face Pull"               => 5,   "Barbell Curl"           => 10,
  "Hammer Curl"             => 5,
  "Barbell Squat"           => 30,  "Romanian Deadlift"      => 20,
  "Leg Press"               => 40,  "Leg Curl"               => 10,
  "Leg Extension"           => 10,  "Bulgarian Split Squat"  => 10,
  "Calf Raise"              => 15
}

# PPL rotation: Push, Pull, Legs, Push, Pull (5 days), then 2 rest days
ppl_cycle = [push, pull, legs, push, pull]
workout_notes = [
  nil, "Felt strong today", nil, "Good session", nil,
  "Slight fatigue from yesterday", nil, "PR attempt", nil,
  "Quick session", nil, "Great pump", nil, "Pushed hard today", nil
]

rng = Random.new(42) # deterministic seed for reproducible data

90.downto(0) do |days_ago|
  date = days_ago.days.ago
  day_of_week = date.wday # 0=Sun, 6=Sat

  # Rest on Wednesdays and Sundays (wday 0 and 3)
  next if day_of_week == 0 || day_of_week == 3

  # Pick program based on rotating through Push/Pull/Legs cycle
  # Use a counter based on how many workout days have passed
  workout_index = (90 - days_ago) % 3
  program = [push, pull, legs][workout_index]

  session = WorkoutSession.find_or_create_by!(
    user: demo,
    workout_program: program,
    started_at: date.change(hour: 6, min: 30)
  ) do |s|
    duration_minutes = rng.rand(55..80)
    s.completed_at = date.change(hour: 6, min: 30) + duration_minutes.minutes
    s.notes = workout_notes[rng.rand(workout_notes.length)]
  end

  next if session.session_sets.any?

  # Progress fraction: 0.0 at day 90 ago, 1.0 at today
  progress = (90 - days_ago) / 90.0

  program.program_exercises.each do |pe|
    ex_name = pe.exercise.name
    base = exercise_base_weights[ex_name] || 100
    gain = exercise_weight_gain[ex_name] || 10

    # Current weight with progressive overload + daily variance
    current_weight = base + (gain * progress)
    daily_variance = rng.rand(-5.0..5.0)
    working_weight = ((current_weight + daily_variance) / 5.0).round * 5.0
    working_weight = [working_weight, 5.0].max

    num_sets = pe.target_sets
    target_reps = pe.target_reps

    (1..num_sets).each do |set_num|
      is_warmup = set_num == 1
      set_weight = is_warmup ? (working_weight * 0.6).round(-1) : working_weight

      # Reps decrease slightly on later sets (fatigue)
      fatigue_drop = is_warmup ? 2 : [0, set_num - 2].max
      reps = [target_reps + rng.rand(-1..1) - fatigue_drop, 3].max
      rpe = is_warmup ? rng.rand(4.0..6.0).round(1) : rng.rand(7.0..9.5).round(1)

      SessionSet.create!(
        workout_session: session,
        exercise: pe.exercise,
        set_number: set_num,
        weight_lbs: set_weight,
        reps: reps,
        rpe: rpe,
        warmup: is_warmup
      )
    end
  end
end

# ---------------------------------------------------------------------------
# 90 days of Oura sleep data
# ---------------------------------------------------------------------------
puts "Creating 90 days of Oura sleep data..."

90.downto(0) do |days_ago|
  date = days_ago.days.ago.to_date
  day_of_week = date.wday

  # Better sleep on rest days (Wed/Sun) and weekends
  is_rest_day = [0, 3, 6].include?(day_of_week)

  base_sleep_score = is_rest_day ? rng.rand(78..92) : rng.rand(68..88)
  # Occasional bad night (~10% chance)
  base_sleep_score -= rng.rand(15..25) if rng.rand < 0.10

  total_sleep = is_rest_day ? rng.rand(440..490) : rng.rand(390..470)
  deep_sleep = rng.rand(55..95)
  rem_sleep = rng.rand(80..125)
  awake = rng.rand(8..32)
  light_sleep = total_sleep - deep_sleep - rem_sleep - awake
  light_sleep = [light_sleep, 60].max

  OuraSleepDatum.find_or_create_by!(user: demo, date: date) do |s|
    s.sleep_score = base_sleep_score.clamp(35, 100)
    s.total_sleep_minutes = total_sleep
    s.deep_sleep_minutes = deep_sleep
    s.rem_sleep_minutes = rem_sleep
    s.light_sleep_minutes = light_sleep
    s.awake_minutes = awake
    s.efficiency = rng.rand(80..97)
  end
end

# ---------------------------------------------------------------------------
# 90 days of Oura readiness data
# ---------------------------------------------------------------------------
puts "Creating 90 days of Oura readiness data..."

90.downto(0) do |days_ago|
  date = days_ago.days.ago.to_date
  day_of_week = date.wday
  is_rest_day = [0, 3, 6].include?(day_of_week)

  # Higher readiness on rest days
  readiness = is_rest_day ? rng.rand(75..95) : rng.rand(58..88)
  # Occasional dip
  readiness -= rng.rand(10..20) if rng.rand < 0.08

  hrv = rng.rand(25.0..65.0).round(1)
  rhr = rng.rand(52..62)
  temp_delta = rng.rand(-0.3..0.5).round(2)

  OuraReadinessDatum.find_or_create_by!(user: demo, date: date) do |r|
    r.readiness_score = readiness.clamp(40, 100)
    r.hrv_average = hrv
    r.resting_heart_rate = rhr
    r.body_temperature_delta = temp_delta
  end
end

# ---------------------------------------------------------------------------
# 90 days of Oura activity data
# ---------------------------------------------------------------------------
puts "Creating 90 days of Oura activity data..."

90.downto(0) do |days_ago|
  date = days_ago.days.ago.to_date
  day_of_week = date.wday

  # Lower activity on weekends
  is_weekend = [0, 6].include?(day_of_week)

  steps = is_weekend ? rng.rand(4000..9000) : rng.rand(7000..14000)
  active_cal = is_weekend ? rng.rand(150..400) : rng.rand(300..650)
  total_cal = active_cal + rng.rand(1800..2400)
  active_min = is_weekend ? rng.rand(20..60) : rng.rand(40..95)

  OuraActivityDatum.find_or_create_by!(user: demo, date: date) do |a|
    a.steps = steps
    a.active_calories = active_cal
    a.total_calories = total_cal
    a.active_minutes = active_min
  end
end

# ---------------------------------------------------------------------------
# 90 days of nutrition data (4 meals/day)
# ---------------------------------------------------------------------------
puts "Creating 90 days of nutrition entries..."

meals = {
  "Breakfast" => [
    { food_name: "Oatmeal with Berries", calories: 350, protein_g: 12, carbs_g: 55, fat_g: 8, fiber_g: 6, sugar_g: 15, sodium_mg: 120 },
    { food_name: "Greek Yogurt Parfait", calories: 280, protein_g: 20, carbs_g: 35, fat_g: 6, fiber_g: 3, sugar_g: 20, sodium_mg: 80 },
    { food_name: "Eggs and Toast", calories: 420, protein_g: 24, carbs_g: 30, fat_g: 22, fiber_g: 2, sugar_g: 3, sodium_mg: 520 },
    { food_name: "Protein Pancakes", calories: 380, protein_g: 28, carbs_g: 40, fat_g: 10, fiber_g: 4, sugar_g: 12, sodium_mg: 350 },
    { food_name: "Smoothie Bowl", calories: 320, protein_g: 18, carbs_g: 48, fat_g: 8, fiber_g: 7, sugar_g: 25, sodium_mg: 60 }
  ],
  "Lunch" => [
    { food_name: "Grilled Chicken Salad", calories: 480, protein_g: 42, carbs_g: 20, fat_g: 25, fiber_g: 5, sugar_g: 6, sodium_mg: 680 },
    { food_name: "Turkey Sandwich", calories: 520, protein_g: 35, carbs_g: 45, fat_g: 18, fiber_g: 4, sugar_g: 8, sodium_mg: 820 },
    { food_name: "Chicken Rice Bowl", calories: 600, protein_g: 45, carbs_g: 65, fat_g: 14, fiber_g: 3, sugar_g: 5, sodium_mg: 750 },
    { food_name: "Tuna Wrap", calories: 450, protein_g: 38, carbs_g: 35, fat_g: 16, fiber_g: 3, sugar_g: 4, sodium_mg: 700 },
    { food_name: "Beef Burrito Bowl", calories: 650, protein_g: 40, carbs_g: 55, fat_g: 22, fiber_g: 8, sugar_g: 6, sodium_mg: 900 }
  ],
  "Dinner" => [
    { food_name: "Salmon with Vegetables", calories: 550, protein_g: 40, carbs_g: 25, fat_g: 30, fiber_g: 6, sugar_g: 8, sodium_mg: 450 },
    { food_name: "Steak and Sweet Potato", calories: 680, protein_g: 48, carbs_g: 45, fat_g: 28, fiber_g: 5, sugar_g: 12, sodium_mg: 580 },
    { food_name: "Pasta with Meat Sauce", calories: 620, protein_g: 32, carbs_g: 75, fat_g: 18, fiber_g: 4, sugar_g: 10, sodium_mg: 900 },
    { food_name: "Grilled Chicken and Rice", calories: 580, protein_g: 45, carbs_g: 55, fat_g: 12, fiber_g: 3, sugar_g: 4, sodium_mg: 650 },
    { food_name: "Shrimp Stir Fry", calories: 500, protein_g: 35, carbs_g: 40, fat_g: 18, fiber_g: 5, sugar_g: 7, sodium_mg: 800 }
  ],
  "Snack" => [
    { food_name: "Protein Shake", calories: 240, protein_g: 30, carbs_g: 15, fat_g: 5, fiber_g: 1, sugar_g: 6, sodium_mg: 200 },
    { food_name: "Mixed Nuts", calories: 180, protein_g: 5, carbs_g: 8, fat_g: 16, fiber_g: 2, sugar_g: 2, sodium_mg: 95 },
    { food_name: "Apple with Peanut Butter", calories: 260, protein_g: 7, carbs_g: 30, fat_g: 14, fiber_g: 5, sugar_g: 20, sodium_mg: 120 },
    { food_name: "Cottage Cheese with Fruit", calories: 200, protein_g: 22, carbs_g: 18, fat_g: 4, fiber_g: 2, sugar_g: 14, sodium_mg: 350 },
    { food_name: "Protein Bar", calories: 220, protein_g: 20, carbs_g: 25, fat_g: 8, fiber_g: 3, sugar_g: 8, sodium_mg: 180 }
  ]
}

90.downto(0) do |days_ago|
  date = days_ago.days.ago.to_date

  meals.each do |meal_name, foods|
    food = foods[rng.rand(foods.length)]

    # Add slight calorie variance per day
    cal_variance = rng.rand(-30..30)

    NutritionEntry.find_or_create_by!(user: demo, date: date, meal_name: meal_name) do |entry|
      entry.food_name = food[:food_name]
      entry.calories = food[:calories] + cal_variance
      entry.protein_g = food[:protein_g] + rng.rand(-3..3)
      entry.carbs_g = food[:carbs_g] + rng.rand(-5..5)
      entry.fat_g = food[:fat_g] + rng.rand(-2..2)
      entry.fiber_g = food[:fiber_g]
      entry.sugar_g = food[:sugar_g]
      entry.sodium_mg = food[:sodium_mg]
      entry.source = "manual"
    end
  end
end

# ---------------------------------------------------------------------------
# Sample anomalies for the notification drawer
# ---------------------------------------------------------------------------
puts "Creating sample anomalies..."

anomalies = [
  {
    date: 2.days.ago.to_date,
    metric: "resting_heart_rate",
    value: 68,
    baseline_mean: 56.5,
    z_score: 2.8,
    severity: "high",
    message: "Resting heart rate of 68 bpm is significantly above your 30-day average of 56.5 bpm. This could indicate overtraining, illness, or elevated stress.",
    correlated_metric: "sleep_score",
    dismissed_at: nil
  },
  {
    date: 5.days.ago.to_date,
    metric: "sleep_score",
    value: 42,
    baseline_mean: 79.3,
    z_score: -3.1,
    severity: "high",
    message: "Sleep score of 42 is well below your 30-day average of 79. Poor sleep may impact recovery and workout performance over the next 1-2 days.",
    correlated_metric: "readiness_score",
    dismissed_at: nil
  },
  {
    date: 8.days.ago.to_date,
    metric: "hrv_average",
    value: 22,
    baseline_mean: 44.8,
    z_score: -2.5,
    severity: "medium",
    message: "HRV dropped to 22 ms, significantly below your baseline of 44.8 ms. Consider a lighter workout today.",
    correlated_metric: "resting_heart_rate",
    dismissed_at: nil
  },
  {
    date: 14.days.ago.to_date,
    metric: "daily_calories",
    value: 1450,
    baseline_mean: 2650.0,
    z_score: -2.9,
    severity: "medium",
    message: "Only 1,450 calories logged today vs. your 2,650 average. Large caloric deficits can impair recovery.",
    correlated_metric: nil,
    dismissed_at: nil
  },
  {
    date: 22.days.ago.to_date,
    metric: "steps",
    value: 1200,
    baseline_mean: 9500.0,
    z_score: -2.6,
    severity: "low",
    message: "Step count was unusually low at 1,200 vs. your average of 9,500. Likely a rest or travel day.",
    correlated_metric: "active_calories",
    dismissed_at: 20.days.ago # dismissed anomaly
  }
]

anomalies.each do |attrs|
  Anomaly.find_or_create_by!(user: demo, date: attrs[:date], metric: attrs[:metric]) do |a|
    a.value = attrs[:value]
    a.baseline_mean = attrs[:baseline_mean]
    a.z_score = attrs[:z_score]
    a.severity = attrs[:severity]
    a.message = attrs[:message]
    a.correlated_metric = attrs[:correlated_metric]
    a.dismissed_at = attrs[:dismissed_at]
  end
end

# ── Demo Reports ──────────────────────────────────────────────
puts "Creating demo reports..."

demo_reports = [
  {
    date: Date.current - 1,
    report_type: "daily",
    scores: { overall: 82, nutrition: 8, sleep: 9, recovery: 8, training: 7 },
    analysis_text: "Strong day overall. Your nutrition was dialed in — 182g protein at 185 lbs bodyweight puts you at 0.98g/lb, right in the sweet spot for lean muscle growth. Sleep was excellent: 7h 48m total with 1h 22m deep sleep, which supports muscle protein synthesis overnight.\n\nTraining hit chest and triceps with solid progressive overload — your bench press moved up 5 lbs to 225x6, and incline DB press maintained 80x8. Volume was appropriate at 18 working sets across the session.\n\nThe one gap: your calorie intake (2,180 kcal) is slightly below your 2,400 target. On a training day, you want to be at or slightly above target to fuel recovery and growth. Consider adding a post-workout shake or evening snack to close that 220-calorie gap.\n\nHRV came in at 62ms — above your 7-day average of 55ms — suggesting good recovery from yesterday's rest day. Readiness score of 84 confirms you were primed to train hard today.",
    recommendations: [
      "Add 200-250 kcal on training days — a post-workout shake with 40g protein + banana would close the gap perfectly",
      "Bench press is trending up (215→220→225 over 3 weeks). Next session, attempt 225x7 or 230x5 to keep progressive overload moving",
      "Sleep consistency is paying off — keep the 10:30pm bedtime. Your deep sleep percentage (29%) is above average"
    ]
  },
  {
    date: Date.current - 2,
    report_type: "daily",
    scores: { overall: 71, nutrition: 6, sleep: 7, recovery: 8, training: 8 },
    analysis_text: "Mixed day — training was a highlight but nutrition fell short. Your back and biceps session showed genuine strength gains: barbell rows hit 185x8 (up from 175x8 last week), and weighted pull-ups at +25lbs for 3x6 is impressive.\n\nHowever, protein intake dropped to 142g — well below your 180g target and only 0.77g/lb of bodyweight. This is below the 0.8-1.2g/lb range needed for optimal muscle protein synthesis. The culprit appears to be a light lunch (salad, 320 kcal, 18g protein). On heavy pulling days, you need more fuel.\n\nSleep was decent at 7h 12m but deep sleep was only 52 minutes — your lowest this week. This correlates with the later bedtime (11:45pm vs your usual 10:30pm). Even one hour of sleep timing shift can reduce deep sleep by 15-25%.\n\nResting heart rate at 58 bpm and HRV at 51ms are both within normal range, indicating you're recovering adequately despite the nutrition miss.",
    recommendations: [
      "Prioritize hitting 180g+ protein — prep a high-protein lunch in advance on training days (grilled chicken + rice = easy 45g protein)",
      "Get back to the 10:30pm bedtime tonight. The late night directly impacted your deep sleep quality",
      "Barbell row progression is excellent. Next session aim for 185x9 or 190x6 to maintain the upward trend",
      "Consider a casein protein shake before bed on training days — slow-digesting protein supports overnight recovery"
    ]
  },
  {
    date: Date.current - 3,
    report_type: "daily",
    scores: { overall: 88, nutrition: 9, sleep: 9, recovery: 9, training: 8 },
    analysis_text: "Near-perfect rest day execution. This is what active recovery should look like: 9,847 steps (burning an estimated 400+ NEAT calories), nutrition on point at 2,350 kcal with 191g protein, and sleep was your best this week at 8h 15m with 1h 38m deep sleep.\n\nYour body is clearly recovering well — HRV jumped to 68ms (highest in 14 days), resting HR dropped to 54 bpm, and readiness score hit 91. This kind of parasympathetic dominance means your nervous system has fully recovered from the week's training load.\n\nThe high step count on a rest day is doing double duty: it's elevating your TDEE without adding training stress, which accelerates fat loss while maintaining your recovery. At 185 lbs, those ~10K steps burned roughly 450 calories through NEAT alone.\n\nMacro split was excellent: 35% protein, 40% carbs, 25% fat. The higher carb intake on a rest day helps replenish glycogen stores ahead of tomorrow's leg session.",
    recommendations: [
      "Tomorrow's leg day: you're fully recovered (HRV 68ms, readiness 91). Push hard — attempt a squat PR or add volume",
      "Keep this rest day template: 10K steps + high protein + early bedtime. It's clearly working for your recovery",
      "Your 7-day protein average is now 174g — trending up from 161g two weeks ago. Consistency is building"
    ]
  },
  {
    date: Date.current,
    report_type: "weekly",
    scores: { overall: 79, nutrition: 7, sleep: 8, recovery: 8, training: 8 },
    analysis_text: "Solid week with clear progressive overload across major lifts. At 185 lbs targeting 175 lbs at ~15% body fat, you're in a body recomposition phase that requires precision — and this week showed you can execute.\n\n**Training:** 4 sessions this week (Push/Pull/Legs/Upper), totaling 68 working sets and 127,450 lbs total volume — up 4.2% from last week's 122,320 lbs. Key progressions: bench 220→225, squat 275→280, barbell row 175→185. Deadlift held steady at 315x5. All major compounds trending up = progressive overload is working.\n\n**Nutrition:** Average daily intake was 2,280 kcal with 174g protein (0.94g/lb). Protein consistency improved — only 1 day below 160g vs 3 days last week. However, calorie intake was ~120 kcal below your 2,400 target on average. At your activity level (~9K daily steps + 4 training sessions), your estimated TDEE is ~2,800. A 2,280 intake creates a ~520 calorie deficit, which is slightly aggressive for recomp. Consider bumping to 2,400-2,500 to slow the cut and preserve muscle.\n\n**Recovery:** Sleep averaged 7h 28m with a 7-day HRV average of 57ms. Both are adequate but not optimal. Your 2 best training days (Tuesday bench PR, Thursday squat PR) followed nights with 7.5+ hours and HRV above 60ms. The correlation is clear: better sleep = better performance.\n\n**Activity:** Averaged 8,940 steps/day with 2 dedicated cardio/walk days. Total weekly NEAT from steps alone is estimated at ~2,800 calories. This is a massive contributor to your deficit — don't underestimate walking.",
    recommendations: [
      "Increase daily calories to 2,400-2,500 to slow the deficit from ~520 to ~300-400. This preserves more muscle during the cut while still losing ~0.5 lb/week of fat",
      "Target 8+ hours sleep on nights before heavy compound days (legs, back). Your PR attempts directly correlate with sleep quality above 7.5 hours",
      "Deadlift has stalled at 315x5 for 3 weeks. Try a deload to 285x5 next week, then ramp back up with 295→305→315→320 over 4 weeks",
      "Protein consistency is improving. Lock in the habit: 40g breakfast, 45g lunch, 45g dinner, 40g shake = 170g minimum before any snacks",
      "Keep the 9K+ daily steps — this is your secret weapon for fat loss without additional training stress"
    ]
  }
]

demo_reports.each do |r|
  report = demo.daily_reports.find_or_initialize_by(date: r[:date], report_type: r[:report_type])
  report.update!(
    analysis_text: r[:analysis_text],
    scores: r[:scores],
    recommendations: r[:recommendations],
    raw_data_snapshot: {},
    model_used: "claude-sonnet-4-20250514",
    prompt_tokens: rand(2000..3000),
    completion_tokens: rand(800..1200)
  )
end

puts "  Reports: #{DailyReport.count}"

puts "Seed complete!"
puts "  Exercises: #{Exercise.count}"
puts "  Programs: #{WorkoutProgram.count}"
puts "  Program Exercises: #{ProgramExercise.count}"
puts "  Workout Sessions: #{WorkoutSession.count}"
puts "  Session Sets: #{SessionSet.count}"
puts "  Nutrition Entries: #{NutritionEntry.count}"
puts "  Oura Sleep: #{OuraSleepDatum.count}"
puts "  Oura Readiness: #{OuraReadinessDatum.count}"
puts "  Oura Activity: #{OuraActivityDatum.count}"
puts "  Anomalies: #{Anomaly.count}"
puts "  Demo user: demo@claude-fit.dev / password123"
