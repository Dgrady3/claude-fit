module Api
  module V1
    class ReadinessController < BaseController
      def today
        today_readiness = current_user.oura_readiness_data.find_by(date: Date.current)
        today_sleep = current_user.oura_sleep_data.find_by(date: Date.current)

        baseline_data = current_user.oura_readiness_data
          .where(date: 30.days.ago.to_date..Date.yesterday)

        baseline_hrv = baseline_data.average(:hrv_average)&.to_f
        baseline_rhr = baseline_data.average(:resting_heart_rate)&.to_f
        baseline_readiness = baseline_data.average(:readiness_score)&.to_f

        unless today_readiness
          return render json: { available: false }
        end

        hrv_delta_pct = baseline_hrv&.positive? ?
          (((today_readiness.hrv_average.to_f - baseline_hrv) / baseline_hrv) * 100).round(1) : nil

        rhr_delta = baseline_rhr ?
          (today_readiness.resting_heart_rate.to_i - baseline_rhr).round(1) : nil

        score = today_readiness.readiness_score.to_i
        level = if score >= 85 then "peak"
                elsif score >= 70 then "good"
                elsif score >= 55 then "moderate"
                else "low"
                end

        recommendation = case level
        when "peak"
          "Readiness is excellent — great day to push intensity or attempt PRs."
        when "good"
          "Recovery looks solid. Train as planned."
        when "moderate"
          "Recovery is below average. Consider reducing volume by 15-20% or focusing on technique work."
        when "low"
          "Your body needs recovery. Light movement or rest day recommended."
        end

        render json: {
          available: true,
          level: level,
          readiness_score: score,
          sleep_score: today_sleep&.sleep_score,
          hrv: today_readiness.hrv_average&.to_f&.round(0),
          hrv_delta_pct: hrv_delta_pct,
          resting_hr: today_readiness.resting_heart_rate,
          rhr_delta: rhr_delta,
          recommendation: recommendation,
          baseline: {
            hrv: baseline_hrv&.round(0),
            resting_hr: baseline_rhr&.round(0),
            readiness: baseline_readiness&.round(0)
          }
        }
      end
    end
  end
end
