# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_03_06_214611) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "anomalies", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "date", null: false
    t.string "metric", null: false
    t.decimal "value", precision: 8, scale: 2
    t.decimal "baseline_mean", precision: 8, scale: 2
    t.decimal "z_score", precision: 4, scale: 2
    t.string "severity"
    t.string "message"
    t.string "correlated_metric"
    t.datetime "dismissed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "date", "metric"], name: "index_anomalies_on_user_id_and_date_and_metric", unique: true
    t.index ["user_id"], name: "index_anomalies_on_user_id"
  end

  create_table "daily_reports", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "date", null: false
    t.text "analysis_text"
    t.jsonb "recommendations", default: {}
    t.jsonb "scores", default: {}
    t.jsonb "raw_data_snapshot", default: {}
    t.string "model_used"
    t.integer "prompt_tokens"
    t.integer "completion_tokens"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "report_type", default: "daily", null: false
    t.index ["user_id", "date", "report_type"], name: "index_daily_reports_on_user_id_and_date_and_report_type", unique: true
    t.index ["user_id"], name: "index_daily_reports_on_user_id"
  end

  create_table "exercise_insights", force: :cascade do |t|
    t.bigint "video_knowledge_id", null: false
    t.string "exercise_name", null: false
    t.string "muscle_group"
    t.string "recommended_sets"
    t.string "recommended_reps"
    t.string "recommended_rest_seconds"
    t.string "recommended_rpe"
    t.text "key_insight"
    t.decimal "confidence", precision: 3, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["exercise_name"], name: "index_exercise_insights_on_exercise_name"
    t.index ["muscle_group"], name: "index_exercise_insights_on_muscle_group"
    t.index ["video_knowledge_id"], name: "index_exercise_insights_on_video_knowledge_id"
  end

  create_table "exercises", force: :cascade do |t|
    t.string "name", null: false
    t.string "muscle_group"
    t.string "equipment"
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["muscle_group"], name: "index_exercises_on_muscle_group"
    t.index ["name", "user_id"], name: "index_exercises_on_name_and_user_id", unique: true
    t.index ["user_id"], name: "index_exercises_on_user_id"
  end

  create_table "glucose_readings", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.datetime "recorded_at"
    t.decimal "value_mgdl", precision: 5, scale: 1
    t.string "source"
    t.string "meal_context"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_glucose_readings_on_user_id"
  end

  create_table "nutrition_entries", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "date", null: false
    t.string "meal_name"
    t.string "food_name", null: false
    t.decimal "calories", precision: 7, scale: 1
    t.decimal "protein_g", precision: 6, scale: 1
    t.decimal "carbs_g", precision: 6, scale: 1
    t.decimal "fat_g", precision: 6, scale: 1
    t.decimal "fiber_g", precision: 6, scale: 1
    t.decimal "sugar_g", precision: 6, scale: 1
    t.decimal "sodium_mg", precision: 7, scale: 1
    t.string "source", default: "manual"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "date"], name: "index_nutrition_entries_on_user_id_and_date"
    t.index ["user_id"], name: "index_nutrition_entries_on_user_id"
  end

  create_table "oauth_tokens", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "provider", null: false
    t.text "access_token_ciphertext"
    t.text "refresh_token_ciphertext"
    t.datetime "expires_at"
    t.string "scope"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "provider"], name: "index_oauth_tokens_on_user_id_and_provider", unique: true
    t.index ["user_id"], name: "index_oauth_tokens_on_user_id"
  end

  create_table "oura_activity_data", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "date", null: false
    t.integer "activity_score"
    t.integer "steps"
    t.integer "active_calories"
    t.integer "total_calories"
    t.integer "active_minutes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "date"], name: "index_oura_activity_data_on_user_id_and_date", unique: true
    t.index ["user_id"], name: "index_oura_activity_data_on_user_id"
  end

  create_table "oura_readiness_data", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "date", null: false
    t.integer "readiness_score"
    t.decimal "hrv_average", precision: 6, scale: 2
    t.integer "resting_heart_rate"
    t.decimal "body_temperature_delta", precision: 4, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "date"], name: "index_oura_readiness_data_on_user_id_and_date", unique: true
    t.index ["user_id"], name: "index_oura_readiness_data_on_user_id"
  end

  create_table "oura_sleep_data", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "date", null: false
    t.integer "sleep_score"
    t.integer "deep_sleep_minutes"
    t.integer "rem_sleep_minutes"
    t.integer "light_sleep_minutes"
    t.integer "total_sleep_minutes"
    t.integer "awake_minutes"
    t.decimal "efficiency", precision: 5, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "date"], name: "index_oura_sleep_data_on_user_id_and_date", unique: true
    t.index ["user_id"], name: "index_oura_sleep_data_on_user_id"
  end

  create_table "program_exercises", force: :cascade do |t|
    t.bigint "workout_program_id", null: false
    t.bigint "exercise_id", null: false
    t.integer "position"
    t.integer "rest_seconds", default: 90
    t.integer "target_sets", default: 3
    t.integer "target_reps", default: 10
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["exercise_id"], name: "index_program_exercises_on_exercise_id"
    t.index ["workout_program_id"], name: "index_program_exercises_on_workout_program_id"
  end

  create_table "session_sets", force: :cascade do |t|
    t.bigint "workout_session_id", null: false
    t.bigint "exercise_id", null: false
    t.integer "set_number", null: false
    t.decimal "weight_lbs", precision: 6, scale: 1
    t.integer "reps"
    t.decimal "rpe", precision: 3, scale: 1
    t.boolean "warmup", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["exercise_id"], name: "index_session_sets_on_exercise_id"
    t.index ["workout_session_id"], name: "index_session_sets_on_workout_session_id"
  end

  create_table "user_goals", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "goal_type", null: false
    t.decimal "target_value", precision: 8, scale: 2
    t.decimal "current_value", precision: 8, scale: 2
    t.date "target_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "goal_type"], name: "index_user_goals_on_user_id_and_goal_type"
    t.index ["user_id"], name: "index_user_goals_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "jti", null: false
    t.string "name"
    t.decimal "body_weight_lbs", precision: 5, scale: 1
    t.integer "height_inches"
    t.integer "age"
    t.string "sex"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "video_knowledges", force: :cascade do |t|
    t.string "youtube_video_id", null: false
    t.string "title"
    t.string "channel"
    t.string "url"
    t.integer "duration_seconds"
    t.text "topic_summary"
    t.jsonb "key_takeaways", default: []
    t.text "transcript"
    t.string "model_used"
    t.integer "prompt_tokens"
    t.integer "completion_tokens"
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["channel"], name: "index_video_knowledges_on_channel"
    t.index ["youtube_video_id"], name: "index_video_knowledges_on_youtube_video_id", unique: true
  end

  create_table "workout_programs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.text "description"
    t.boolean "active", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_workout_programs_on_user_id"
  end

  create_table "workout_sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "workout_program_id"
    t.datetime "started_at"
    t.datetime "completed_at"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_workout_sessions_on_user_id"
    t.index ["workout_program_id"], name: "index_workout_sessions_on_workout_program_id"
  end

  add_foreign_key "anomalies", "users"
  add_foreign_key "daily_reports", "users"
  add_foreign_key "exercise_insights", "video_knowledges"
  add_foreign_key "exercises", "users"
  add_foreign_key "glucose_readings", "users"
  add_foreign_key "nutrition_entries", "users"
  add_foreign_key "oauth_tokens", "users"
  add_foreign_key "oura_activity_data", "users"
  add_foreign_key "oura_readiness_data", "users"
  add_foreign_key "oura_sleep_data", "users"
  add_foreign_key "program_exercises", "exercises"
  add_foreign_key "program_exercises", "workout_programs"
  add_foreign_key "session_sets", "exercises"
  add_foreign_key "session_sets", "workout_sessions"
  add_foreign_key "user_goals", "users"
  add_foreign_key "workout_programs", "users"
  add_foreign_key "workout_sessions", "users"
  add_foreign_key "workout_sessions", "workout_programs"
end
