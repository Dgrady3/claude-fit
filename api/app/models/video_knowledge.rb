class VideoKnowledge < ApplicationRecord
  has_many :exercise_insights, dependent: :destroy

  validates :youtube_video_id, presence: true, uniqueness: true
end
