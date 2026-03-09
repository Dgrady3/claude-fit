class NightlySyncJob < ApplicationJob
  queue_as :default

  def perform
    User.find_each do |user|
      sync_oura(user)
      generate_report(user)
    rescue StandardError => e
      Rails.logger.error("NightlySyncJob failed for user #{user.id}: #{e.message}")
    end
  end

  private

  def sync_oura(user)
    return unless user.oauth_tokens.exists?(provider: "oura")
    OuraSyncService.new.call(user)
  end

  def generate_report(user)
    DailyAnalysisService.new.call(user, Date.current)
  end
end
