class OauthToken < ApplicationRecord
  belongs_to :user

  has_encrypted :access_token, :refresh_token

  validates :provider, presence: true

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def refresh_needed?
    expires_at.present? && expires_at < 5.minutes.from_now
  end
end
