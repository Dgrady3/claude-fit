class WorkoutProgramSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :description, :active

  has_many :program_exercises, serializer: ProgramExerciseSerializer
end
