class ProgramExercise < ApplicationRecord
  belongs_to :workout_program
  belongs_to :exercise

  acts_as_list scope: :workout_program

  validates :target_sets, numericality: { greater_than: 0 }
  validates :target_reps, numericality: { greater_than: 0 }
end
