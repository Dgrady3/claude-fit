class WeeklyAnalysisJob < ApplicationJob
  queue_as :default

  def perform
    User.find_each do |user|
      WeeklyAnalysisService.new.call(user, Date.current)
    rescue StandardError => e
      Rails.logger.error("WeeklyAnalysisJob failed for user #{user.id}: #{e.message}")
    end
  end
end
