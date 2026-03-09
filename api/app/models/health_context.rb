class HealthContext < ApplicationRecord
  belongs_to :user

  validates :category, presence: true
  validates :content, presence: true

  CATEGORIES = %w[
    medical_history
    injuries
    supplements
    allergies
    lifestyle
    goals
    preferences
    conditions
    medications
    general_health
  ].freeze

  validates :category, inclusion: { in: CATEGORIES }

  scope :recent, -> { order(updated_at: :desc) }
  scope :by_category, ->(cat) { where(category: cat) }
end
