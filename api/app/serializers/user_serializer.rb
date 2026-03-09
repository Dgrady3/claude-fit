class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :email, :name, :body_weight_lbs, :height_inches, :age, :sex

  attribute :oura_connected do |user|
    user.oauth_tokens.exists?(provider: "oura")
  end
end
