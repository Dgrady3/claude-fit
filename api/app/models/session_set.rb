class SessionSet < ApplicationRecord
  belongs_to :workout_session
  belongs_to :exercise

  validates :weight_lbs, numericality: { greater_than_or_equal_to: 0 }
  validates :reps, numericality: { greater_than: 0 }
  validates :set_number, numericality: { greater_than: 0 }

  scope :working_sets, -> { where(warmup: false) }
end
