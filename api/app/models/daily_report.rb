class DailyReport < ApplicationRecord
  belongs_to :user

  validates :date, uniqueness: { scope: [:user_id, :report_type] }
  validates :report_type, inclusion: { in: %w[daily weekly] }

  scope :recent, -> { order(date: :desc).limit(30) }
  scope :daily, -> { where(report_type: "daily") }
  scope :weekly, -> { where(report_type: "weekly") }
end
