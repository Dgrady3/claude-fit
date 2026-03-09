module Api
  module V1
    class AnomaliesController < BaseController
      def index
        anomalies = current_user.anomalies.active.recent
        render json: anomalies.map { |a|
          {
            id: a.id,
            date: a.date,
            metric: a.metric,
            value: a.value.to_f,
            baseline_mean: a.baseline_mean.to_f,
            z_score: a.z_score.to_f,
            severity: a.severity,
            message: a.message,
            correlated_metric: a.correlated_metric
          }
        }
      end

      def dismiss
        anomaly = current_user.anomalies.find(params[:id])
        anomaly.update!(dismissed_at: Time.current)
        head :no_content
      end
    end
  end
end
