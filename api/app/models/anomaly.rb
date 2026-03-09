class Anomaly < ApplicationRecord
  belongs_to :user
  scope :active, -> { where(dismissed_at: nil) }
  scope :recent, -> { where("date >= ?", 30.days.ago).order(date: :desc) }
end
