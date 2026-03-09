class NutritionEntry < ApplicationRecord
  belongs_to :user

  validates :date, presence: true
  validates :food_name, presence: true

  scope :for_date, ->(date) { where(date: date) }
end
