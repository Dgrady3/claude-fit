class OuraSleepDatum < ApplicationRecord
  self.table_name = "oura_sleep_data"

  belongs_to :user

  validates :date, uniqueness: { scope: :user_id }
end
