class ProgramExerciseSerializer
  include JSONAPI::Serializer

  attributes :id, :position, :rest_seconds, :target_sets, :target_reps

  belongs_to :exercise, serializer: ExerciseSerializer
end
