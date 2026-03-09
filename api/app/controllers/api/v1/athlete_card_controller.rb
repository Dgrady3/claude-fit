module Api
  module V1
    class AthleteCardController < BaseController
      def show
        sessions = current_user.workout_sessions.completed
        all_sets = sessions.includes(session_sets: :exercise).flat_map { |s| s.session_sets.working_sets }

        best_lifts = all_sets.group_by { |s| s.exercise.name }
          .transform_values { |sets| sets.map(&:weight_lbs).max }
          .sort_by { |_, w| -w }
          .first(5)
          .map { |name, weight| { exercise: name, weight: weight } }

        streak = calculate_streak(sessions)

        sleep_avg = current_user.oura_sleep_data.where(date: 30.days.ago.to_date..Date.current).average(:sleep_score)&.round(0)
        steps_avg = current_user.oura_activity_data.where(date: 30.days.ago.to_date..Date.current).average(:steps)&.round(0)

        render json: {
          name: current_user.name || "Athlete",
          total_sessions: sessions.count,
          total_volume: all_sets.sum { |s| s.weight_lbs * s.reps },
          best_lifts: best_lifts,
          streak_weeks: streak,
          avg_sleep_score: sleep_avg,
          avg_steps: steps_avg,
          member_since: current_user.created_at.strftime("%B %Y")
        }
      end

      private

      def calculate_streak(sessions)
        return 0 if sessions.empty?
        weeks_with_workouts = sessions.map { |s| s.started_at.to_date.beginning_of_week(:monday) }.uniq.sort.reverse
        streak = 0
        current_week = Date.current.beginning_of_week(:monday)
        weeks_with_workouts.each do |week|
          break if week < current_week - streak.weeks - 1.week
          streak += 1 if week == current_week - streak.weeks
        end
        streak
      end
    end
  end
end
