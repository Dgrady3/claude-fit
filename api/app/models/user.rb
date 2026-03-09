class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  has_many :user_goals, dependent: :destroy
  has_many :exercises, dependent: :destroy
  has_many :workout_programs, dependent: :destroy
  has_many :workout_sessions, dependent: :destroy
  has_many :nutrition_entries, dependent: :destroy
  has_many :oura_sleep_data, class_name: "OuraSleepDatum", dependent: :destroy
  has_many :oura_readiness_data, class_name: "OuraReadinessDatum", dependent: :destroy
  has_many :oura_activity_data, class_name: "OuraActivityDatum", dependent: :destroy
  has_many :glucose_readings, dependent: :destroy
  has_many :daily_reports, dependent: :destroy
  has_many :oauth_tokens, dependent: :destroy
  has_many :anomalies, dependent: :destroy

  def jwt_payload
    super
  end
end
