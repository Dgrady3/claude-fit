class AnomalyDetectionJob < ApplicationJob
  queue_as :default

  METRICS = {
    sleep_score: { model: :oura_sleep_data, field: :sleep_score, direction: :low_is_bad },
    hrv: { model: :oura_readiness_data, field: :hrv_average, direction: :low_is_bad },
    resting_hr: { model: :oura_readiness_data, field: :resting_heart_rate, direction: :high_is_bad },
    steps: { model: :oura_activity_data, field: :steps, direction: :low_is_bad },
  }.freeze

  def perform
    User.find_each do |user|
      detect_anomalies(user)
    rescue StandardError => e
      Rails.logger.error("AnomalyDetection failed for user #{user.id}: #{e.message}")
    end
  end

  private

  def detect_anomalies(user)
    yesterday = Date.yesterday
    baseline_start = yesterday - 30.days

    METRICS.each do |metric_name, config|
      relation = user.send(config[:model])
      baseline = relation.where(date: baseline_start..yesterday - 1.day)

      values = baseline.pluck(config[:field]).compact.map(&:to_f)
      next if values.size < 7

      mean = values.sum / values.size
      std_dev = Math.sqrt(values.map { |v| (v - mean)**2 }.sum / values.size)
      next if std_dev.zero?

      today_record = relation.find_by(date: yesterday)
      next unless today_record

      value = today_record.send(config[:field]).to_f
      z_score = ((value - mean) / std_dev).round(2)

      anomalous = case config[:direction]
                  when :low_is_bad then z_score <= -2.0
                  when :high_is_bad then z_score >= 2.0
                  end

      next unless anomalous

      severity = z_score.abs >= 3.0 ? "critical" : "warning"
      message = build_message(metric_name, value, mean, z_score, config[:direction])

      user.anomalies.find_or_initialize_by(date: yesterday, metric: metric_name.to_s).update!(
        value: value,
        baseline_mean: mean.round(2),
        z_score: z_score,
        severity: severity,
        message: message
      )
    end

    yesterday_anomalies = user.anomalies.where(date: yesterday)
    if yesterday_anomalies.count >= 2
      names = yesterday_anomalies.pluck(:metric)
      yesterday_anomalies.each do |a|
        others = names - [a.metric]
        a.update(correlated_metric: others.first) if others.any?
      end
    end
  end

  def build_message(metric, value, mean, z_score, direction)
    metric_label = metric.to_s.tr('_', ' ')
    deviation = (direction == :low_is_bad) ? "below" : "above"
    "Your #{metric_label} (#{value.round(0)}) was #{z_score.abs} standard deviations #{deviation} your 30-day average (#{mean.round(0)})."
  end
end
