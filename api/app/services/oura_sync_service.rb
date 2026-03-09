class OuraSyncService
  BASE_URL = "https://api.ouraring.com/v2/usercollection".freeze

  def call(user)
    token = user.oauth_tokens.find_by(provider: "oura")
    return { error: "No Oura token found" } unless token

    refresh_if_needed(user, token)

    start_date = 7.days.ago.to_date.to_s
    end_date = Date.current.to_s

    sync_sleep(user, token, start_date, end_date)
    sync_readiness(user, token, start_date, end_date)
    sync_activity(user, token, start_date, end_date)

    { success: true }
  rescue StandardError => e
    { error: e.message }
  end

  private

  def refresh_if_needed(user, token)
    return unless token.refresh_needed?
    OuraOauthService.new.refresh_token(user)
    token.reload
  end

  def conn(token)
    Faraday.new(url: BASE_URL) do |f|
      f.request :json
      f.response :json
      f.headers["Authorization"] = "Bearer #{token.access_token}"
    end
  end

  def sync_sleep(user, token, start_date, end_date)
    response = conn(token).get("daily_sleep", start_date: start_date, end_date: end_date)
    return unless response.success?

    (response.body["data"] || []).each do |entry|
      user.oura_sleep_data.find_or_initialize_by(date: entry["day"]).update!(
        sleep_score: entry.dig("score"),
        deep_sleep_minutes: seconds_to_minutes(entry.dig("contributors", "deep_sleep")),
        rem_sleep_minutes: seconds_to_minutes(entry.dig("contributors", "rem_sleep")),
        total_sleep_minutes: seconds_to_minutes(entry.dig("contributors", "total_sleep")),
        light_sleep_minutes: nil,
        awake_minutes: nil,
        efficiency: entry.dig("contributors", "efficiency")
      )
    end
  end

  def sync_readiness(user, token, start_date, end_date)
    response = conn(token).get("daily_readiness", start_date: start_date, end_date: end_date)
    return unless response.success?

    (response.body["data"] || []).each do |entry|
      user.oura_readiness_data.find_or_initialize_by(date: entry["day"]).update!(
        readiness_score: entry["score"],
        hrv_average: entry.dig("contributors", "hrv_balance"),
        resting_heart_rate: entry.dig("contributors", "resting_heart_rate"),
        body_temperature_delta: entry.dig("contributors", "body_temperature")
      )
    end
  end

  def sync_activity(user, token, start_date, end_date)
    response = conn(token).get("daily_activity", start_date: start_date, end_date: end_date)
    return unless response.success?

    (response.body["data"] || []).each do |entry|
      user.oura_activity_data.find_or_initialize_by(date: entry["day"]).update!(
        activity_score: entry["score"],
        steps: entry["steps"],
        active_calories: entry["active_calories"],
        total_calories: entry["total_calories"],
        active_minutes: entry.dig("contributors", "meet_daily_targets")
      )
    end
  end

  def seconds_to_minutes(value)
    return nil unless value
    (value.to_f / 60).round
  end
end
