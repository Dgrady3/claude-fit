class OuraReadinessDatum < ApplicationRecord
  self.table_name = "oura_readiness_data"

  belongs_to :user

  validates :date, uniqueness: { scope: :user_id }
end
