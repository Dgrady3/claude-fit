class OuraActivityDatum < ApplicationRecord
  self.table_name = "oura_activity_data"

  belongs_to :user

  validates :date, uniqueness: { scope: :user_id }
end
