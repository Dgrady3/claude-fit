class SessionSetSerializer
  include JSONAPI::Serializer

  attributes :id, :set_number, :weight_lbs, :reps, :rpe, :warmup

  belongs_to :exercise, serializer: ExerciseSerializer
end
