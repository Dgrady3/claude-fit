class UserGoal < ApplicationRecord
  belongs_to :user

  GOAL_TYPES = %w[target_weight body_fat_pct daily_protein_g daily_calories].freeze

  validates :goal_type, presence: true, inclusion: { in: GOAL_TYPES }
  validates :target_value, presence: true
end
