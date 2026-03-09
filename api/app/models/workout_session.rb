class WorkoutSession < ApplicationRecord
  belongs_to :user
  belongs_to :workout_program, optional: true
  has_many :session_sets, dependent: :destroy

  scope :completed, -> { where.not(completed_at: nil) }
  scope :recent, -> { where(started_at: 30.days.ago..) }

  def duration
    return nil unless started_at && completed_at
    completed_at - started_at
  end

  def total_volume
    session_sets.where(warmup: false).sum("weight_lbs * reps")
  end
end
