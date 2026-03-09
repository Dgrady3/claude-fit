class ExerciseInsight < ApplicationRecord
  belongs_to :video_knowledge

  validates :exercise_name, presence: true

  scope :for_muscle_group, ->(group) { where(muscle_group: group) }
  scope :high_confidence, -> { where("confidence >= ?", 0.7) }
end
