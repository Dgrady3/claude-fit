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

  def highlights
    session_sets.where(warmup: false)
      .includes(:exercise)
      .group_by(&:exercise_id)
      .map do |_exercise_id, sets|
        top = sets.max_by(&:weight_lbs)
        next unless top&.exercise
        { exercise: top.exercise.name, weight: top.weight_lbs, reps: top.reps }
      end
      .compact
      .sort_by { |h| -h[:weight] }
      .first(3)
  end
end
