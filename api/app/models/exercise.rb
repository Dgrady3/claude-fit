class Exercise < ApplicationRecord
  belongs_to :user, optional: true
  has_many :program_exercises, dependent: :destroy
  has_many :session_sets, dependent: :destroy

  validates :name, presence: true

  scope :global, -> { where(user_id: nil) }
  scope :for_user, ->(user) { where(user_id: [nil, user.id]) }
end
