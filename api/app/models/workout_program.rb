class WorkoutProgram < ApplicationRecord
  belongs_to :user
  has_many :program_exercises, -> { order(:position) }, dependent: :destroy
  has_many :exercises, through: :program_exercises
  has_many :workout_sessions, dependent: :nullify

  validates :name, presence: true

  scope :active, -> { where(active: true) }

  accepts_nested_attributes_for :program_exercises, allow_destroy: true
end
