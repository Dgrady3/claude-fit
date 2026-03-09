class ExerciseSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :muscle_group, :equipment
end
