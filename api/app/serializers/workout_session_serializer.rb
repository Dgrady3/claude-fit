class WorkoutSessionSerializer
  include JSONAPI::Serializer

  attributes :id, :started_at, :completed_at, :notes

  attribute :duration do |session|
    session.duration
  end

  attribute :total_volume do |session|
    session.total_volume
  end

  attribute :highlights do |session|
    session.highlights
  end

  has_many :session_sets, serializer: SessionSetSerializer
  belongs_to :workout_program, serializer: WorkoutProgramSerializer
end
