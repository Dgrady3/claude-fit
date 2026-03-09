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

        all_sets = sessions.flat_map { |s| s.session_sets.working_sets }
        exercises_used = all_sets.map { |s| s.exercise.name }.uniq.sort

        exercise_history = {}
        exercises_used.each do |name|
          ex_sets = all_sets.select { |s| s.exercise.name == name }
          by_date = ex_sets.group_by { |s| s.workout_session.started_at.to_date }

          exercise_history[name] = by_date.map do |date, sets|
            max_w = sets.map(&:weight_lbs).max
            max_reps_at_max = sets.select { |s| s.weight_lbs == max_w }.map(&:reps).max
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
          calories: current_user.try(:daily_calorie_target) || 2400,
          protein_g: current_user.try(:daily_protein_target) || 180
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
